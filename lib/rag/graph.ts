import { StateGraph, Annotation } from "@langchain/langgraph";
import { ragEngine } from "./engine";
import { evaluateRAG } from "./evaluator";
import { Chunk } from "./vector-store";

/**
 * Message interface for graph history
 */
export interface GraphMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Source interface for citations
 */
export interface GraphSource {
  id: number;
  text: string;
  documentName: string;
  similarity: number;
}

/**
 * Define the State Graph schema for advanced agentic RAG.
 */
export const RAGGraphState = Annotation.Root({
  // Inputs
  query: Annotation<string>(),
  history: Annotation<GraphMessage[]>(),
  settings: Annotation<{ webSearch?: boolean; deepSearch?: boolean }>(),

  // Rewritten queries
  vectorQuery: Annotation<string>(),
  keywordQuery: Annotation<string>(),
  academicQuery: Annotation<string>(),

  // Retrieval & ranking outputs
  retrievedChunks: Annotation<Chunk[]>(),
  sources: Annotation<GraphSource[]>(),

  // Outputs
  messages: Annotation<GraphMessage[]>(),
  responseHtml: Annotation<string>(),
  evaluation: Annotation<any>(),

  // Correction control state
  retryCount: Annotation<number>(),
  feedbackText: Annotation<string>(),
  hallucinations: Annotation<string[]>(),
  missingInfo: Annotation<string[]>(),
  refinementKeywords: Annotation<string[]>(),
  /** Whether the evaluator believes retrying will improve results. */
  retryWorthiness: Annotation<boolean>(),
  /** High-level verdict: "pass" | "partial" | "fail". */
  overallVerdict: Annotation<string>(),
});

/**
 * Node: rewriteQuery
 * Uses the LLM to analyze the research query and generate optimized search queries for vector,
 * keyword, and academic search. Supports feedback loop corrections.
 */
async function rewriteQueryNode(state: typeof RAGGraphState.State, config?: any) {
  const query = state.query || "";
  const history = state.history || [];
  const feedbackText = state.feedbackText || "";
  
  const rawHallucinations = state.hallucinations;
  const hallucinations = Array.isArray(rawHallucinations) ? rawHallucinations : [];
  
  const rawMissingInfo = state.missingInfo;
  const missingInfo = Array.isArray(rawMissingInfo) ? rawMissingInfo : [];
  
  const rawRefinementKeywords = state.refinementKeywords;
  const refinementKeywords = Array.isArray(rawRefinementKeywords) ? rawRefinementKeywords : [];
  
  const retryCount = state.retryCount || 0;
  const onStep = config?.configurable?.onStep;

  if (onStep) {
    const msg = feedbackText
      ? `Optimizing search terms based on quality audit feedback (retry ${retryCount}/2)...`
      : "Analyzing query semantics & rewriting search queries...";
    onStep(msg, { phase: "rewrite" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[Graph] GROQ_API_KEY is missing. Skipping query rewriting.");
    return {
      vectorQuery: query,
      keywordQuery: query,
      academicQuery: query,
    };
  }

  try {
    const systemMsg = "You are an expert search engine query optimizer. You must analyze the context and user request to output queries in strict JSON.";
    const userMsg = `Analyze the user's research query and the chat history. Generate three search targets:
1. A semantic query optimized for vector database retrieval (rephrase to be descriptive, factual, and complete).
2. A list of space-separated keyword terms for BM25 lexical search (focus on nouns, key entities, and terminology).
3. A focused academic query for publication databases (OpenAlex/Semantic Scholar).

Chat History:
${JSON.stringify(history)}

User Query: "${query}"
${feedbackText ? `
---
[QUALITY AUDIT FAILURE — RETRY ${retryCount}/2]
The previous answer was generated but failed quality verification. You MUST adjust the search queries to specifically target the gaps identified below.

${hallucinations.length > 0 ? `HALLUCINATED CLAIMS (need correct sources to replace these):
${hallucinations.map((h, i) => `  ${i + 1}. ${h}`).join("\n")}` : ""}

${missingInfo.length > 0 ? `MISSING INFORMATION (need sources covering these topics):
${missingInfo.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}` : ""}

${refinementKeywords.length > 0 ? `SUGGESTED SEARCH TERMS (incorporate these into queries):
  ${refinementKeywords.join(", ")}` : ""}

Audit summary: "${feedbackText}"

IMPORTANT: Generate substantially different search queries from the previous attempt. Focus on the missing information and use the suggested search terms.
---` : ""}

Return response in strict JSON:
{
  "vectorQuery": "string",
  "keywordQuery": "string",
  "academicQuery": "string"
}
`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 250,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        console.log("[Graph] Rewriter outputs:", parsed);
        return {
          vectorQuery: parsed.vectorQuery || query,
          keywordQuery: parsed.keywordQuery || query,
          academicQuery: parsed.academicQuery || query,
        };
      }
    }
  } catch (err) {
    console.error("[Graph] Query rewriter failed:", err);
  }

  return {
    vectorQuery: query,
    keywordQuery: query,
    academicQuery: query,
  };
}

/**
 * Node: retrieve
 * Invokes hybridRetrieve on RAGEngine (combining Vector + BM25 + Academic tools + RRF + LLM Re-ranking).
 */
async function retrieveNode(state: typeof RAGGraphState.State, config?: any) {
  const vectorQuery = state.vectorQuery || state.query || "";
  const keywordQuery = state.keywordQuery || state.query || "";
  const academicQuery = state.academicQuery || state.query || "";
  const settings = state.settings || {};
  const onStep = config?.configurable?.onStep;

  if (onStep) {
    onStep(settings.webSearch ? "Retrieving context from local library + academic APIs..." : "Retrieving context from local library...", { phase: "retrieve" });
  }

  const retrieved = await ragEngine.hybridRetrieve(
    vectorQuery,
    keywordQuery,
    academicQuery,
    settings,
    8
  );

  const sources: GraphSource[] = retrieved.map((item, index) => ({
    id: index + 1,
    text: item.text,
    documentName: item.documentName,
    similarity: item.similarity
  }));

  // Send the sources payload immediately to the client if the callback exists
  const onSources = config?.configurable?.onSources;
  if (onSources) {
    onSources(sources);
  }

  return {
    retrievedChunks: retrieved,
    sources
  };
}

/**
 * Node: generate
 * Compiles the final prompt with citations, triggers Groq completion, and streams response tokens.
 * On retry attempts, injects specific directives to address evaluation gaps.
 */
async function generateNode(state: typeof RAGGraphState.State, config?: any) {
  const query = state.query || "";
  const sources = state.sources || [];
  const history = state.history || [];
  const retryCount = state.retryCount || 0;
  const onToken = config?.configurable?.onToken;
  const onStep = config?.configurable?.onStep;
  const onReset = config?.configurable?.onReset;

  if (onReset && retryCount > 0) {
    onReset();
  }

  if (onStep) {
    const msg = retryCount > 0
      ? `Re-synthesizing answer addressing audit gaps (attempt ${retryCount + 1}/3)...`
      : "Synthesizing answer grounded in retrieved literature...";
    onStep(msg, { phase: "generate" });
  }

  let sourcesPromptText = "";
  sources.forEach(source => {
    sourcesPromptText += `=== SOURCE [${source.id}] (from ${source.documentName}) ===\n${source.text}\n\n`;
  });

  let systemPrompt = `You are Nexus, an elite AI research assistant for serious academic and technical work.

Guidelines:
- Be precise, structured, and intellectually honest.
- When a document is provided, ground your answer in its actual content.
- Use clear headings, bullet points, and numbered lists where appropriate.
- State assumptions explicitly when information is incomplete.
- Keep responses focused, high-signal, and free of filler.
- You MUST cite the source paragraphs inline using the format [1], [2], etc., where the number corresponds to the SOURCE ID.
- Place citations immediately after the sentence or clause containing the cited fact, e.g., "...as shown in the study [1]."
- Never invent citations. Only cite a source if it directly supports the statement.`;

  // On retry: inject specific directives to address the evaluation gaps
  if (retryCount > 0) {
    const rawMissingInfo = state.missingInfo;
    const missingInfo = Array.isArray(rawMissingInfo) ? rawMissingInfo : [];
    const rawHallucinations = state.hallucinations;
    const hallucinations = Array.isArray(rawHallucinations) ? rawHallucinations : [];

    let retryDirective = `\n\nCRITICAL — This is retry attempt ${retryCount + 1}. The previous answer failed quality audit.`;
    if (hallucinations.length > 0) {
      retryDirective += `\n- The previous answer contained unsupported claims: ${hallucinations.join("; ")}. Do NOT repeat these unless you find supporting evidence in the sources.`;
    }
    if (missingInfo.length > 0) {
      retryDirective += `\n- The previous answer was missing: ${missingInfo.join("; ")}. Address these gaps if the sources contain relevant information.`;
    }
    retryDirective += `\n- If you cannot find supporting evidence for a claim, explicitly state that the information was not found in the available sources.`;
    systemPrompt += retryDirective;
  }

  let userContent = query;
  if (sources.length > 0) {
    userContent = `${query}\n\n=== SOURCE DOCUMENTS ===\n${sourcesPromptText}=== END ===`;
  } else {
    userContent = `${query}\n\n[System Alert: No context documents were found in the library or academic search. Attempt to answer using general scientific facts, but state clearly that no local documents were matched.]`;
  }

  const messages: GraphMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10),
    { role: "user", content: userContent }
  ];

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      messages,
      responseHtml: "Error: GROQ_API_KEY is not configured."
    };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.4,
        max_tokens: 2048,
        stream: !!onToken, // Stream only if token callback is active
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq API returned status ${res.status}`);
    }

    let responseHtml = "";

    if (onToken && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                responseHtml += token;
                onToken(token);
              }
            } catch (_) {}
          }
        }
      }
    } else {
      const data = await res.json();
      responseHtml = data.choices?.[0]?.message?.content || "";
    }

    return {
      messages,
      responseHtml
    };
  } catch (err: any) {
    console.error("[Graph] Generation failed:", err);
    return {
      messages,
      responseHtml: `Response generation failed: ${err.message}`
    };
  }
}

/**
 * Node: evaluate
 * Audits the generated response for Faithfulness and Relevance.
 * Outputs structured verdict and retryWorthiness for intelligent routing.
 */
async function evaluateNode(state: typeof RAGGraphState.State, config?: any) {
  const query = state.query || "";
  const sources = state.sources || [];
  const responseHtml = state.responseHtml || "";
  const retryCount = state.retryCount || 0;
  const onStep = config?.configurable?.onStep;
  if (onStep) {
    onStep(`Auditing response grounding and relevance (attempt ${retryCount + 1}/3)...`, { phase: "evaluate" });
  }

  const evaluation = await evaluateRAG(query, sources, responseHtml);
  
  const verdict = evaluation.overallVerdict || "partial";
  const retryWorthiness = evaluation.retryWorthiness ?? false;
  let feedbackText = "";

  if (verdict === "fail" || (verdict === "partial" && retryWorthiness)) {
    feedbackText = `Quality audit ${verdict.toUpperCase()}: Faithfulness ${evaluation.faithfulness}%, Relevance ${evaluation.answerRelevance}%. ${evaluation.explanation}`;
    console.log(`[Graph] Evaluation ${verdict} on attempt ${retryCount + 1}. RetryWorthiness: ${retryWorthiness}. Feedback: "${feedbackText.substring(0, 120)}..."`);
    if (onStep) {
      onStep(`Audit ${verdict.toUpperCase()}: Faithfulness ${evaluation.faithfulness}%, Relevance ${evaluation.answerRelevance}%. ${retryWorthiness ? "Re-routing query..." : "Proceeding with best available answer."}`, { phase: "evaluate" });
    }
  } else {
    console.log(`[Graph] Evaluation PASSED. Faithfulness: ${evaluation.faithfulness}%, Relevance: ${evaluation.answerRelevance}%`);
    if (onStep) {
      onStep(`Audit PASSED: Faithfulness ${evaluation.faithfulness}%, Relevance ${evaluation.answerRelevance}%.`, { phase: "evaluate" });
    }
  }

  let finalResponseHtml = responseHtml;
  // If the final verdict is not "pass" after maximum retries (2), append the transparency note
  if (verdict !== "pass" && retryCount >= 2) {
    const note = "\n\n[Note: This response was generated after multiple attempts. Some information may be incomplete or require further verification.]";
    finalResponseHtml = responseHtml + note;
    const onToken = config?.configurable?.onToken;
    if (onToken) {
      onToken(note);
    }
  }

  // Send evaluation result to client immediately if the callback exists
  const onEvaluation = config?.configurable?.onEvaluation;
  if (onEvaluation) {
    onEvaluation(evaluation);
  }

  return {
    evaluation,
    feedbackText,
    hallucinations: evaluation.hallucinations || [],
    missingInfo: evaluation.missingInfo || [],
    refinementKeywords: evaluation.refinementKeywords || [],
    retryWorthiness,
    overallVerdict: verdict,
    retryCount: retryCount + 1,
    responseHtml: finalResponseHtml
  };
}

/**
 * Conditional Router: Uses evaluator's explicit retryWorthiness signal instead of
 * raw score thresholds. Only retries if the evaluator believes re-searching will help
 * AND deep search is enabled AND retry budget remains.
 */
function routeAfterEvaluate(state: typeof RAGGraphState.State) {
  const settings = state.settings || {};
  const retryCount = state.retryCount || 0;
  const retryWorthiness = state.retryWorthiness ?? false;
  const verdict = state.overallVerdict || "pass";

  // Only retry if ALL conditions are met:
  // 1. The evaluator explicitly says retrying will help (retryWorthiness = true)
  // 2. The verdict is not "pass" (there are actual quality issues)
  // 3. Deep Search is enabled (user opted into thorough mode)
  // 4. Retry budget not exhausted (max 2 retries, meaning retryCount is 1 or 2)
  if (retryWorthiness && verdict !== "pass" && retryCount < 3 && settings.deepSearch) {
    console.log(`[Graph Router] Verdict: ${verdict}, retryWorthiness: true. Routing back to query rewrite (Attempt ${retryCount}/2)`);
    return "rewriteQuery";
  }

  if (verdict !== "pass" && retryCount >= 2) {
    console.log(`[Graph Router] Verdict: ${verdict}, but max retries (${retryCount}) reached. Ending with transparency note.`);
  } else if (verdict !== "pass" && !retryWorthiness) {
    console.log(`[Graph Router] Verdict: ${verdict}, but retryWorthiness is false (sources exist, synthesis issue). Ending workflow.`);
  } else {
    console.log(`[Graph Router] Verdict: ${verdict}. Ending workflow.`);
  }

  return "__end__";
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH WORKFLOW COMPILATION
// ─────────────────────────────────────────────────────────────────────────────
const workflow = new StateGraph(RAGGraphState)
  .addNode("rewriteQuery", rewriteQueryNode)
  .addNode("retrieve", retrieveNode)
  .addNode("generate", generateNode)
  .addNode("evaluate", evaluateNode)
  // Define edges
  .addEdge("__start__", "rewriteQuery")
  .addEdge("rewriteQuery", "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", "evaluate")
  .addConditionalEdges("evaluate", routeAfterEvaluate);

export const ragGraph = workflow.compile();
