import { NextRequest, NextResponse } from 'next/server';

async function extractPdfText(base64: string): Promise<string> {
  try {
    // unpdf is purpose-built for Next.js/edge: no dynamic worker issues
    const { extractText } = await import('unpdf');
    const buffer = Buffer.from(base64, 'base64');
    const uint8 = new Uint8Array(buffer);
    const { text } = await extractText(uint8, { mergePages: true });
    return text ?? '';
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[PDF] Extraction error:', errMsg);
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, base64 }: { name: string; type: string; base64: string } = await request.json();

    if (!base64 || !name) {
      return NextResponse.json(
        { success: false, error: 'File base64 data and name are required' },
        { status: 400 }
      );
    }

    let extractedText = '';
    const isPdf = type === 'application/pdf' || name.endsWith('.pdf');

    if (isPdf) {
      extractedText = await extractPdfText(base64);
      console.log(`[PDF Parser] Extracted ${extractedText.length} chars from "${name}"`);
    } else {
      // Plain text, markdown, JSON, code files
      extractedText = Buffer.from(base64, 'base64').toString('utf-8');
      console.log(`[FILE Parser] Read ${extractedText.length} chars from "${name}"`);
    }

    return NextResponse.json({ success: true, text: extractedText });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Parser Route] Unhandled error:', errMsg);
    return NextResponse.json(
      { success: false, error: errMsg || 'Internal server error during parsing' },
      { status: 500 }
    );
  }
}
