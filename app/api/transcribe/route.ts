import { NextRequest, NextResponse } from "next/server";
import { getGroq } from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing 'audio' file in form data" },
        { status: 400 }
      );
    }

    const filename =
      (audio as File).name && (audio as File).name.length > 0
        ? (audio as File).name
        : "recording.webm";
    const file = new File([audio], filename, {
      type: audio.type || "audio/webm",
    });

    const groq = getGroq();
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/transcribe] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
