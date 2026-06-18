import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function extractPdfText(base64: string): Promise<string> {
  try {
    // unpdf is purpose-built for Next.js/edge: no dynamic worker issues
    const { extractText } = await import('unpdf');
    const buffer = Buffer.from(base64, 'base64');
    const uint8 = new Uint8Array(buffer);
    const { text } = await extractText(uint8, { mergePages: true });
    return text ?? '';
  } catch (err) {
    console.error('[PDF] Extraction error:', err);
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      history = [],
      file,
      documents = [],
    }: {
      message: string;
      history?: ChatMessage[];
      file?: { name: string; type: string; base64?: string; content?: string } | null;
      documents?: Array<{ name: string; type: string; base64?: string; content?: string }>;
    } = await request.json();

    if (!message && !file && (!documents || documents.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Message or documents are required' },
        { status: 400 }
      );
    }

    // ── TEXT EXTRACTION ──────────────────────────────────────────────────────
    const activeDocs = [...documents];
    if (file) {
      activeDocs.push(file);
    }

    const processedDocs: Array<{ name: string; content: string }> = [];

    for (const doc of activeDocs) {
      let docContent = doc.content ?? '';
      if (doc.base64 && !docContent) {
        try {
          const isPdf = doc.type === 'application/pdf' || doc.name.endsWith('.pdf');
          if (isPdf) {
            docContent = await extractPdfText(doc.base64);
            console.log(`[PDF] Extracted ${docContent.length} chars from "${doc.name}"`);
          } else {
            // Plain text, markdown, JSON, code files
            docContent = Buffer.from(doc.base64, 'base64').toString('utf-8');
            console.log(`[FILE] Read ${docContent.length} chars from "${doc.name}"`);
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[FILE] Failed to process ${doc.name}:`, errMsg);
          docContent = `[Could not extract text from "${doc.name}". It may be scanned/image-based or password-protected.]`;
        }
      }
      processedDocs.push({ name: doc.name, content: docContent });
    }

    // Split each document's content into paragraphs/sources for citations
    interface Source {
      id: number;
      text: string;
      documentName: string;
    }
    const sources: Source[] = [];
    let sourcesPromptText = '';
    let sourceId = 1;
    const MAX_CHARS = 12_000;
    let currentTotalLength = 0;

    for (const doc of processedDocs) {
      if (!doc.content.trim() || doc.content.startsWith('[')) {
        continue;
      }
      const rawParagraphs = doc.content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      for (const para of rawParagraphs) {
        if (currentTotalLength + para.length > MAX_CHARS) {
          // If the first paragraph is extremely large, slice it. Otherwise break.
          if (sources.length === 0) {
            const sliced = para.slice(0, MAX_CHARS);
            sources.push({ id: 1, text: sliced, documentName: doc.name });
            sourcesPromptText += `=== SOURCE [1] (from ${doc.name}) ===\n${sliced}\n\n`;
          }
          break;
        }
        sources.push({ id: sourceId, text: para, documentName: doc.name });
        sourcesPromptText += `=== SOURCE [${sourceId}] (from ${doc.name}) ===\n${para}\n\n`;
        currentTotalLength += para.length;
        sourceId++;
      }
    }

    // ── SYSTEM PROMPT ────────────────────────────────────────────────────────
    const systemPrompt = `You are Nexus, an elite AI research assistant for serious academic and technical work.

Guidelines:
- Be precise, structured, and intellectually honest.
- When a document is provided, ground your answer in its actual content.
- Use clear headings, bullet points, and numbered lists where appropriate.
- State assumptions explicitly when information is incomplete.
- Keep responses focused, high-signal, and free of filler.
- You MUST cite the source paragraphs inline using the format [1], [2], etc., where the number corresponds to the SOURCE ID.
- Place citations immediately after the sentence or clause containing the cited fact, e.g., "...as shown in the study [1]."
- Never invent citations. Only cite a source if it directly supports the statement.`;

    // ── BUILD USER MESSAGE ───────────────────────────────────────────────────
    let userContent = message ?? '';

    if (processedDocs.length > 0) {
      const hasText = sources.length > 0;
      if (hasText) {
        userContent = message
          ? `${message}\n\n=== SOURCE DOCUMENTS ===\n${sourcesPromptText}=== END ===`
          : `=== SOURCE DOCUMENTS ===\n${sourcesPromptText}=== END ===\n\nPlease summarize and analyze these documents.`;
      } else {
        const fallbackText = processedDocs
          .map((doc) => `[Attached: ${doc.name} — text extraction unavailable]`)
          .join('\n');
        userContent = message
          ? `${message}\n\n${fallbackText}`
          : `${fallbackText}\n\nDescribe what you need.`;
      }
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: userContent },
    ];

    // ── GROQ CALL ────────────────────────────────────────────────────────────
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.6,
        max_tokens: 2048,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('[Groq] API error:', errText);
      return NextResponse.json({ success: false, error: 'AI service error' }, { status: 502 });
    }

    const groqData = await groqRes.json();
    const aiResponse =
      groqData.choices?.[0]?.message?.content ?? 'Unable to generate a response.';

    return NextResponse.json({ success: true, response: aiResponse, sources });
  } catch (error: unknown) {
    console.error('[Route] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}