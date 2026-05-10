"use client";

import { useState } from "react";
import EmailDraft from "./EmailDraft";

export type Notes = {
  person: {
    name: string | null;
    company: string | null;
    role: string | null;
  };
  takeaways: string[];
  personal: string[];
  followups: string[];
  draftEmail: { subject: string; body: string };
};

type Props = { initial: Notes; transcript: string };

function joinList(items: string[] | undefined): string {
  return (items ?? []).join("\n");
}

function splitList(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.replace(/^[•\-*]\s*/, "").trim())
    .filter(Boolean);
}

export default function NotesReview({ initial, transcript }: Props) {
  const [name, setName] = useState(initial.person?.name ?? "");
  const [company, setCompany] = useState(initial.person?.company ?? "");
  const [role, setRole] = useState(initial.person?.role ?? "");
  const [takeaways, setTakeaways] = useState(joinList(initial.takeaways));
  const [personal, setPersonal] = useState(joinList(initial.personal));
  const [followups, setFollowups] = useState(joinList(initial.followups));
  const [subject, setSubject] = useState(initial.draftEmail?.subject ?? "");
  const [body, setBody] = useState(initial.draftEmail?.body ?? "");
  const [recipient, setRecipient] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{
    sheetUrl: string;
    draftUrl: string;
  } | null>(null);

  async function handleSave() {
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          recipient: recipient.trim(),
          person: { name, company, role },
          takeaways: splitList(takeaways),
          personal: splitList(personal),
          followups: splitList(followups),
          draftEmail: { subject, body },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      setSaved({ sheetUrl: data.sheetUrl, draftUrl: data.draftUrl });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Review</h2>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Company" value={company} onChange={setCompany} />
        <Field label="Role" value={role} onChange={setRole} />
      </div>

      <TextField
        label="Takeaways (one per line)"
        value={takeaways}
        onChange={setTakeaways}
        rows={4}
      />
      <TextField
        label="Personal details (one per line)"
        value={personal}
        onChange={setPersonal}
        rows={3}
      />
      <TextField
        label="Follow-ups (one per line)"
        value={followups}
        onChange={setFollowups}
        rows={3}
      />

      <EmailDraft
        subject={subject}
        body={body}
        onSubjectChange={setSubject}
        onBodyChange={setBody}
      />

      <Field
        label="Recipient email (for Gmail draft)"
        value={recipient}
        onChange={setRecipient}
        type="email"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !recipient.trim()}
          className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save to Sheet + Gmail draft"}
        </button>
      </div>

      {saveError && (
        <pre className="whitespace-pre-wrap text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {saveError}
        </pre>
      )}

      {saved && (
        <div className="text-sm bg-green-50 border border-green-200 rounded p-3 flex flex-col gap-1">
          <span className="font-semibold text-green-800">Saved.</span>
          <a
            className="text-blue-700 underline"
            href={saved.sheetUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open Sheet
          </a>
          <a
            className="text-blue-700 underline"
            href={saved.draftUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open Gmail draft
          </a>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded border border-gray-300 bg-white p-2"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <label className="flex flex-col text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 rounded border border-gray-300 bg-white p-2 font-mono text-sm"
      />
    </label>
  );
}
