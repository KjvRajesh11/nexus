import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface FeedbackLog {
  id: string;
  timestamp: string;
  query: string;
  response: string;
  feedback: "up" | "down";
  correction?: string;
  evaluation?: {
    faithfulness: number;
    contextRelevance: number;
    answerRelevance: number;
  };
  sources?: {
    id: number;
    documentName?: string;
    text: string;
  }[];
  /** The evaluator's own verdict for this response. */
  evaluationVerdict?: "pass" | "partial" | "fail";
  /** How many retry attempts the agentic loop performed. */
  retryCount?: number;
  /** Session ID for grouping feedback within a conversation. */
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, response, feedback, correction, evaluation, sources, evaluationVerdict, retryCount, sessionId } = body;

    if (!feedback || !query) {
      return NextResponse.json(
        { success: false, error: "Query and feedback ('up' or 'down') are required fields." },
        { status: 400 }
      );
    }

    const workspaceRoot = process.cwd();
    const dataDir = path.join(workspaceRoot, "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const feedbackFilePath = path.join(dataDir, "feedback.jsonl");

    const newLog: FeedbackLog = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      query,
      response,
      feedback,
      correction: correction || undefined,
      evaluation: evaluation || undefined,
      sources: sources || undefined,
      evaluationVerdict: evaluationVerdict || undefined,
      retryCount: typeof retryCount === "number" ? retryCount : undefined,
      sessionId: sessionId || undefined,
    };

    // Append a single JSONL line instead of reading/rewriting the entire file.
    // This is safe under concurrent writes and stays fast as the file grows.
    fs.appendFileSync(feedbackFilePath, JSON.stringify(newLog) + "\n", "utf-8");
    console.log(`[Feedback Route] Feedback logged: ID=${newLog.id}, type=${feedback}, verdict=${evaluationVerdict || "n/a"}, retries=${retryCount ?? "n/a"}`);

    return NextResponse.json({ success: true, id: newLog.id });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Feedback Route] Unhandled exception:", errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
