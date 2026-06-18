import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] }: { message: string; history?: ChatMessage[] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // ==================== ELITE SYSTEM PROMPT ====================
    const systemPrompt = `You are Nexus, an elite AI research assistant designed for serious academic, technical, and research work.

Your core principles:
- Deliver precise, insightful, and well-structured responses.
- Prioritize accuracy and intellectual honesty above all else.
- Use clear headings, bullet points, and numbered lists for better readability.
- Reference key concepts, methodologies, or papers when relevant.
- Clearly state assumptions or uncertainties when information is incomplete or evolving.
- Keep responses focused, high-signal, and free of unnecessary fluff.
- Adapt depth and complexity based on the user's level (technical depth for experts, clarity for students and beginners).

You are helpful, professional, and intellectually rigorous.`;  

    // Build message history (last 10 messages for context)
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Keep only last 10 messages
      { role: 'user', content: message },
    ];

    // ==================== GROQ API CALL ====================
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.65,           // Slightly lower for more focused answers
        max_tokens: 1800,
        top_p: 0.9,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API Error:', data);
      return NextResponse.json(
        { success: false, error: 'AI service temporarily unavailable' },
        { status: 500 }
      );
    }

    const aiResponse = data.choices?.[0]?.message?.content?.trim() || 
      'I apologize, but I was unable to generate a response. Please try again.';

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });

  } catch (error: any) {
    console.error('Route Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}