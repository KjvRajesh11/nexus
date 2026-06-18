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
    }: {
      message: string;
      history?: ChatMessage[];
      file?: { name: string; type: string; base64?: string; content?: string } | null;
    } = await request.json();

    if (!message && !file) {
      return NextResponse.json(
        { success: false, error: 'Message or file is required' },
        { status: 400 }
      );
    }

    // ── TEXT EXTRACTION ──────────────────────────────────────────────────────
    let fileContent = file?.content ?? '';

    if (file && file.base64 && !fileContent) {
      try {
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        if (isPdf) {
          fileContent = await extractPdfText(file.base64);
          console.log(`[PDF] Extracted ${fileContent.length} chars from "${file.name}"`);
        } else {
          // Plain text, markdown, JSON, code files
          fileContent = Buffer.from(file.base64, 'base64').toString('utf-8');
          console.log(`[FILE] Read ${fileContent.length} chars from "${file.name}"`);
        }
      } catch (err: any) {
        console.error('[FILE] Failed to process file:', err.message);
        fileContent = `[Could not extract text from "${file.name}". It may be scanned/image-based or password-protected.]`;
      }
    }

    // Trim to ~12,000 chars to stay within safe token limits (~3k tokens)
    const MAX_CHARS = 12_000;
    if (fileContent.length > MAX_CHARS) {
      fileContent = fileContent.slice(0, MAX_CHARS) + '\n\n[... document truncated for token limits ...]';
    }

    // ── SYSTEM PROMPT ────────────────────────────────────────────────────────
    const systemPrompt = `You are Nexus, an elite AI research assistant for serious academic and technical work.

Guidelines:
- Be precise, structured, and intellectually honest.
- When a document is provided, ground your answer in its actual content.
- Use clear headings, bullet points, and numbered lists where appropriate.
- State assumptions explicitly when information is incomplete.
- Keep responses focused, high-signal, and free of filler.`;

    // ── BUILD USER MESSAGE ───────────────────────────────────────────────────
    let userContent = message ?? '';

    if (file) {
      const hasText = fileContent.trim() && !fileContent.startsWith('[');
      if (hasText) {
        userContent = message
          ? `${message}\n\n=== DOCUMENT: ${file.name} ===\n${fileContent.trim()}\n=== END ===`
          : `=== DOCUMENT: ${file.name} ===\n${fileContent.trim()}\n=== END ===\n\nPlease summarize and analyze this document.`;
      } else {
        userContent = message
          ? `${message}\n\n[Attached: ${file.name} — text extraction unavailable]`
          : `[Attached: ${file.name} — text extraction unavailable. Describe what you need.]`;
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

    return NextResponse.json({ success: true, response: aiResponse });
  } catch (error: any) {
    console.error('[Route] Unhandled error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}