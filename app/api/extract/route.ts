import { NextRequest, NextResponse } from "next/server";
import { getGemini } from "@/lib/llm";
import { buildExtractionPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json(
        { error: "Missing 'transcript' string in body" },
        { status: 400 }
      );
    }

    const userName = process.env.USER_NAME || "Me";
    const prompt = buildExtractionPrompt(transcript, userName);

    const gemini = getGemini();
    const model = gemini.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Gemini returned non-JSON output", raw: text },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/extract] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
