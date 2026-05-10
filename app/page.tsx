"use client";

import { useState } from "react";
import Recorder from "@/components/Recorder";

export default function Home() {
  const [transcript, setTranscript] = useState("");

  return (
    <main className="mx-auto max-w-2xl p-8 flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold">Networking Companion</h1>
        <p className="text-sm text-gray-600">Phase 1: record &amp; transcribe</p>
      </header>

      <Recorder onTranscript={setTranscript} />

      <section>
        <h2 className="text-lg font-semibold mb-2">Transcript</h2>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Transcript will appear here after recording…"
          className="w-full min-h-[240px] rounded border border-gray-300 bg-white p-3 text-sm font-mono"
        />
      </section>
    </main>
  );
}
