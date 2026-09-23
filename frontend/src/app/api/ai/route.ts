import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return new Response(
        "Shaoor AI Assistant is currently undergoing configuration. Please check back shortly.",
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const result = streamText({
      model: google("gemini-3.6-flash"),
      system:
        "You are the Shaoor Academic Assistant, an AI expert helping researchers, authors, and peer reviewers on the Shaoor Open Access Academic Review Platform. Provide concise, high-quality, academic guidance on paper structure, peer-review feedback, methodology, and citations.",
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("AI assistant route error:", error);
    return new Response(
      "An error occurred while generating the AI response. Please try again.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}
