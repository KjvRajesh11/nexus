import { NextRequest, NextResponse } from "next/server";
import { ragGraph } from "@/lib/rag/graph";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      history = [],
      settings = { webSearch: true, deepSearch: true },
    }: {
      message: string;
      history?: ChatMessage[];
      settings?: { webSearch?: boolean; deepSearch?: boolean };
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    console.log(`[Chat Route] Starting agentic RAG workflow. Query: "${message.substring(0, 50)}..."`);
    console.log(`[Chat Route] Active settings:`, settings);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Define callbacks that stream events back to the client immediately
          const onToken = (token: string) => {
            const tokenMsg = JSON.stringify({ type: "token", token }) + "\n";
            controller.enqueue(encoder.encode(tokenMsg));
          };

          const onReset = () => {
            const resetMsg = JSON.stringify({ type: "reset" }) + "\n";
            controller.enqueue(encoder.encode(resetMsg));
          };

          const onSources = (sources: any[]) => {
            const sourcesMsg = JSON.stringify({ type: "sources", sources }) + "\n";
            controller.enqueue(encoder.encode(sourcesMsg));
          };

          const onEvaluation = (evaluation: any) => {
            const evalMsg = JSON.stringify({ type: "evaluation", evaluation }) + "\n";
            controller.enqueue(encoder.encode(evalMsg));
          };

          const onStep = (stepName: string, meta: { phase: string }) => {
            const stepMsg = JSON.stringify({ type: "step", step: stepName, phase: meta.phase }) + "\n";
            controller.enqueue(encoder.encode(stepMsg));
          };

          // Invoke the LangGraph workflow
          await ragGraph.invoke(
            {
              query: message,
              history: history.map(msg => ({
                role: msg.role === "assistant" ? "assistant" as const : "user" as const,
                content: msg.content
              })),
              settings,
              retryCount: 0,
              feedbackText: ""
            },
            {
              configurable: {
                onToken,
                onReset,
                onSources,
                onEvaluation,
                onStep
              }
            }
          );

          controller.close();
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : "RAG workflow execution error";
          console.error("[Chat Route Stream Error] Fail:", err);
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