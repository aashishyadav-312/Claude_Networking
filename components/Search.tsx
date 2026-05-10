"use client";

import { useState } from "react";

type Row = {
  date: string;
  name: string;
  company: string;
  role: string;
  takeaways: string;
  personal: string;
  followups: string;
  draftEmail: string;
  emailStatus: string;
  transcript: string;
};

export default function Search() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Search failed (${res.status})`);
      setRows(data.rows as Row[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Search past conversations</h2>

      <form onSubmit={run} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, company, topic… (blank = list all)"
          className="flex-1 rounded border border-gray-300 bg-white p-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-gray-800 text-white text-sm hover:bg-gray-900 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <pre className="whitespace-pre-wrap text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </pre>
      )}

      {rows && rows.length === 0 && (
        <p className="text-sm text-gray-600">No matches.</p>
      )}

      {rows && rows.length > 0 && (
        <ul className="flex flex-col gap-3">
          {rows.map((r, i) => (
            <li
              key={i}
              className="rounded border border-gray-200 bg-white p-3 text-sm flex flex-col gap-2"
            >
              <div className="flex justify-between text-xs text-gray-500">
                <span>{r.date}</span>
                <span>{r.emailStatus}</span>
              </div>
              <div className="font-semibold">
                {r.name || "(no name)"}
                {r.company && ` — ${r.company}`}
                {r.role && ` · ${r.role}`}
              </div>
              {r.takeaways && <Detail label="Takeaways" body={r.takeaways} />}
              {r.personal && <Detail label="Personal" body={r.personal} />}
              {r.followups && <Detail label="Follow-ups" body={r.followups} />}
              {r.draftEmail && <Detail label="Email" body={r.draftEmail} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Detail({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <span className="text-xs uppercase text-gray-500">{label}</span>
      <pre className="whitespace-pre-wrap text-sm font-sans">{body}</pre>
    </div>
  );
}
