import { NextRequest, NextResponse } from "next/server";
import { ragGraph } from "@/lib/rag/graph";
import { evaluateRAG } from "@/lib/rag/evaluator";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      history = [],
    }: {
      message: string;
      history?: ChatMessage[];
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    console.log(`[Chat Route] Invoking RAG LangGraph for query: "${message.substring(0, 50)}..."`);

    // 1. Run LangGraph to perform semantic retrieval and compile system prompt messages
    const graphState = await ragGraph.invoke({
      query: message,
      history: history.map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      }))
    });

    const compiledMessages = graphState.messages;
    const sources = graphState.sources || [];

    console.log(`[Chat Route] Retrieved ${sources.length} sources. Calling Groq...`);

    // 2. Stream generation from Groq API
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: compiledMessages,
        temperature: 0.6,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[Groq API] Error:", errText);
      let errMsg = "AI service error";
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch (_) {}
      return NextResponse.json({ success: false, error: errMsg }, { status: groqRes.status });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 2.1. Send the sources payload immediately to the client
          const sourcesMsg = JSON.stringify({ type: "sources", sources }) + "\n";
          controller.enqueue(encoder.encode(sourcesMsg));

          // 2.2. Stream Groq completion tokens
          const reader = groqRes.body?.getReader();
          if (!reader) {
            throw new Error("Groq response body is not readable");
          }

          let buffer = "";
          let accumulatedText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (trimmed === "data: [DONE]") continue;

              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const token = parsed.choices?.[0]?.delta?.content;
                  if (token) {
                    accumulatedText += token;
                    const tokenMsg = JSON.stringify({ type: "token", token }) + "\n";
                    controller.enqueue(encoder.encode(tokenMsg));
                  }
                } catch (e) {
                  console.error("Error parsing SSE line:", jsonStr, e);
                }
              }
            }
          }

          // 2.3. Perform RAG Evaluation in the background and stream the metrics payload
          console.log("[Chat Route] Answer generation complete. Triggering RAG evaluation...");
          try {
            const evaluation = await evaluateRAG(message, sources, accumulatedText);
            const evalMsg = JSON.stringify({ type: "evaluation", evaluation }) + "\n";
            controller.enqueue(encoder.encode(evalMsg));
            console.log("[Chat Route] RAG evaluation completed and sent.");
          } catch (evalErr) {
            console.error("[Chat Route] Evaluation failed:", evalErr);
          }

          controller.close();
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : "Stream error";
          console.error("[Stream] Streaming error:", err);
          const errorMsg = JSON.stringify({ type: "error", error: errMsg }) + "\n";
          controller.enqueue(encoder.encode(errorMsg));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("[Chat Route] Unhandled exception:", error);
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}