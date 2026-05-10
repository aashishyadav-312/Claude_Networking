"use client";

import { useRef, useState } from "react";

type Status = "idle" | "recording" | "transcribing" | "error";

type Props = {
  onTranscript: (text: string) => void;
};

export default function Recorder({ onTranscript }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function pickMimeType(): string {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    for (const t of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return "";
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopTimer();
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        cleanupStream();
        await transcribe(blob);
      };

      recorder.start();
      setStatus("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not start recording";
      setError(msg);
      setStatus("error");
      cleanupStream();
    }
  }

  function stop() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      setStatus("transcribing");
      rec.stop();
    }
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function cleanupStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function transcribe(blob: Blob) {
    try {
      const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
      const fd = new FormData();
      fd.append("audio", blob, `recording.${ext}`);

      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Transcription failed (${res.status})`);

      onTranscript(data.text || "");
      setStatus("idle");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transcription failed";
      setError(msg);
      setStatus("error");
    }
  }

  const isRecording = status === "recording";
  const isBusy = status === "transcribing";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isRecording ? stop : start}
        disabled={isBusy}
        className={`px-8 py-6 rounded-full text-white text-lg font-semibold shadow transition
          ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
          ${isBusy ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isRecording ? `Stop (${formatTime(elapsed)})` : isBusy ? "Transcribing…" : "Start recording"}
      </button>

      {status === "transcribing" && (
        <p className="text-sm text-gray-600">Sending audio to Groq Whisper…</p>
      )}

      {error && (
        <pre className="w-full max-w-xl whitespace-pre-wrap text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </pre>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
