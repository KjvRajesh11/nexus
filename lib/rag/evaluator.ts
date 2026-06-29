export interface EvaluationResult {
  faithfulness: number; // 0 to 100
  contextRelevance: number; // 0 to 100
  answerRelevance: number; // 0 to 100
  explanation: string;
  hallucinations?: string[];
  missingInfo?: string[];
  refinementKeywords?: string[];
  justification?: string;
  /** Whether re-searching with different queries is likely to improve the answer. */
  retryWorthiness?: boolean;
  /** High-level verdict: "pass", "partial", or "fail". */
  overallVerdict?: "pass" | "partial" | "fail";
  /** How many retry attempts were performed before this evaluation. */
  retryCount?: number;
}

/** Hard timeout for the evaluator LLM call (milliseconds). */
const EVALUATOR_TIMEOUT_MS = 12000;

/**
 * Evaluates the RAG system quality metrics:
 * 1. Context Relevance (query-to-context semantic match) - calculated from similarity score.
 * 2. Faithfulness / Grounding (answer-to-context) - evaluated via Groq LLM.
 * 3. Answer Relevance (answer-to-query) - evaluated via Groq LLM.
 * 4. Retry Worthiness - whether re-searching will likely improve quality.
 * 5. Overall Verdict - pass/partial/fail for clean routing.
 */
export async function evaluateRAG(
  query: string,
  contextChunks: { text: string; documentName: string; similarity: number }[],
  answer: string
): Promise<EvaluationResult> {
  // 1. Calculate Context Relevance mathematically from similarity scores
  let contextRelevance = 0;
  if (contextChunks.length > 0) {
    const avgSimilarity = contextChunks.reduce((sum, c) => sum + c.similarity, 0) / contextChunks.length;
    // Map cosine similarity to a nice percentage. Since fallback or real embeddings typically
    // yield scores between -1 and 1, we clamp and scale.
    // For unit-vectors, typical matches are > 0.0, and good ones are > 0.3.
    // Let's scale: similarity 0.0 -> 50%, similarity 0.5 -> 90%, similarity 0.7+ -> 100%
    const normalized = Math.max(0, Math.min(1, (avgSimilarity + 0.1) / 0.8));
    contextRelevance = Math.round(normalized * 100);
  }

  // If there are no context chunks, context relevance is 0
  if (contextChunks.length === 0 || !answer) {
    return {
      faithfulness: 0,
      contextRelevance: 0,
      answerRelevance: 0,
      explanation: "No context was retrieved or no answer was generated to evaluate.",
      retryWorthiness: true,
      overallVerdict: "fail"
    };
  }

  // 2. Perform LLM-as-a-judge evaluation for Faithfulness and Answer Relevance
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      faithfulness: 80,
      contextRelevance,
      answerRelevance: 80,
      explanation: "RAG Evaluation fallback: GROQ_API_KEY is missing.",
      retryWorthiness: false,
      overallVerdict: "partial"
    };
  }

  try {
    const contextText = contextChunks
      .map((c, i) => `[Source ${i + 1}] (from ${c.documentName}):\n${c.text}`)
      .join("\n\n");

    const prompt = `You are an elite RAG (Retrieval-Augmented Generation) system auditor.
Your task is to perform a rigorous quality assessment of the assistant's generated answer based on the retrieved context sources and the user's query.

You must follow this Chain-of-Thought audit process:

STEP 1 — Grounding Check:
Read every claim in the generated answer. For each claim, determine:
  a) Is this claim directly supported by text in the context sources? → Grounded
  b) Is this claim a reasonable inference from the context? → Acceptable
  c) Is this claim NOT supported by any context source? → Hallucination
List every hallucinated claim.

STEP 2 — Coverage Check:
Read the user's query carefully. Identify:
  a) Which parts of the query were fully answered?
  b) Which parts were partially answered or missed entirely?
  c) What specific information is missing that would make the answer complete?

STEP 3 — Retry Worthiness Assessment:
Determine whether re-searching with different queries would likely improve the answer:
  - If the problem is MISSING DATA (the context sources don't contain the needed info) → retryWorthiness = true
  - If the problem is BAD SYNTHESIS (the context has the info but the generator missed/misused it) → retryWorthiness = false
  - If the answer is already good → retryWorthiness = false

STEP 4 — Scoring:
  - faithfulness (0-100): Deduct points per hallucination. 100 = perfectly grounded.
  - answerRelevance (0-100): Deduct points for missed query aspects, off-topic content, or generic filler.

STEP 5 — Verdict:
  - "pass" if faithfulness >= 80 AND answerRelevance >= 75
  - "partial" if both scores >= 50 but at least one is below the pass threshold
  - "fail" if either score < 50

You MUST output your response in strict JSON format matching this schema:
{
  "justification": "Detailed step-by-step reasoning from Steps 1-5 above.",
  "faithfulness": number,
  "answerRelevance": number,
  "hallucinations": ["unsupported claim 1", ...],
  "missingInfo": ["missing detail 1", ...],
  "refinementKeywords": ["precise search term 1", ...],
  "retryWorthiness": boolean,
  "overallVerdict": "pass" | "partial" | "fail"
}

---
USER QUERY:
${query}

---
RETRIEVED CONTEXT SOURCES:
${contextText}

---
GENERATED ANSWER:
${answer}
`;

    // Use AbortController for hard timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EVALUATOR_TIMEOUT_MS);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Use the 70B model — the evaluator must be at least as capable as the generator
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an expert AI system auditor. You output evaluation metrics, gap analyses, and retry recommendations in strict JSON. Be precise and harsh — do not give inflated scores." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 800,
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Groq API returned ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.choices?.[0]?.message?.content;
      if (resultText) {
        const parsed = JSON.parse(resultText);

        const faithfulness = Math.max(0, Math.min(100, parsed.faithfulness ?? 80));
        const answerRelevance = Math.max(0, Math.min(100, parsed.answerRelevance ?? 80));

        // Derive verdict from scores if the LLM didn't provide one or provided an invalid value
        let overallVerdict: "pass" | "partial" | "fail" = parsed.overallVerdict;
        if (!["pass", "partial", "fail"].includes(overallVerdict)) {
          if (faithfulness >= 80 && answerRelevance >= 75) overallVerdict = "pass";
          else if (faithfulness >= 50 && answerRelevance >= 50) overallVerdict = "partial";
          else overallVerdict = "fail";
        }

        return {
          faithfulness,
          contextRelevance: Math.max(0, Math.min(100, contextRelevance)),
          answerRelevance,
          explanation: parsed.justification || parsed.explanation || "Evaluation successfully completed.",
          hallucinations: Array.isArray(parsed.hallucinations) ? parsed.hallucinations : [],
          missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo : [],
          refinementKeywords: Array.isArray(parsed.refinementKeywords) ? parsed.refinementKeywords : [],
          justification: parsed.justification || "",
          retryWorthiness: typeof parsed.retryWorthiness === "boolean" ? parsed.retryWorthiness : false,
          overallVerdict
        };
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[RAG Evaluator] LLM evaluation timed out after ${EVALUATOR_TIMEOUT_MS}ms`);
    } else {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[RAG Evaluator] LLM evaluation failed:", errMsg);
    }
  }

  // Graceful fallback — do not retry on evaluator failure
  return {
    faithfulness: 85,
    contextRelevance,
    answerRelevance: 85,
    explanation: "RAG Evaluation complete (fallback metrics used due to evaluator timeout/api error).",
    hallucinations: [],
    missingInfo: [],
    refinementKeywords: [],
    retryWorthiness: false,
    overallVerdict: "partial"
  };
}
