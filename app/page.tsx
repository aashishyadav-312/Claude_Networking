"use client";

import { useState } from "react";
import Recorder from "@/components/Recorder";
import NotesReview, { type Notes } from "@/components/NotesReview";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState<Notes | null>(null);
  const [extractCount, setExtractCount] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  async function extractFor(text: string) {
    setNotes(null);
    if (!text.trim()) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Extract failed (${res.status})`);
      setNotes(data as Notes);
      setExtractCount((n) => n + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Extract failed";
      setExtractError(msg);
    } finally {
      setExtracting(false);
    }
  }

  function handleTranscript(text: string) {
    setTranscript(text);
    extractFor(text);
  }

  return (
    <main className="mx-auto max-w-2xl p-8 flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold">Networking Companion</h1>
      </header>

      <Recorder onTranscript={handleTranscript} />

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transcript</h2>
          <button
            onClick={() => extractFor(transcript)}
            disabled={!transcript.trim() || extracting}
            className="text-sm px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            {extracting ? "Extracting…" : "Re-extract"}
          </button>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Transcript will appear here after recording…"
          className="w-full min-h-[200px] rounded border border-gray-300 bg-white p-3 text-sm font-mono"
        />
      </section>

      {extractError && (
        <pre className="whitespace-pre-wrap text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {extractError}
        </pre>
      )}

      {notes && <NotesReview key={extractCount} initial={notes} />}
    </main>
  );
}
