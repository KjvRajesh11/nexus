import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const systemPrompt = `You are Nexus, a highly capable AI research assistant.
You help with deep research, academic topics, technical explanations, and analysis.
- Be clear, structured, and insightful.
- Use bullet points and headings when helpful.
- If something is uncertain, be honest about it.`;

    // Build messages with history
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,                    // previous messages
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return NextResponse.json({ success: false, error: "API Error" }, { status: 500 });
    }

    const aiResponse = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });

  } catch (error: any) {
    console.error("Route Error:", error);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}