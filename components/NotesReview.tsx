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

type Props = { initial: Notes };

function joinList(items: string[] | undefined): string {
  return (items ?? []).join("\n");
}

export default function NotesReview({ initial }: Props) {
  const [name, setName] = useState(initial.person?.name ?? "");
  const [company, setCompany] = useState(initial.person?.company ?? "");
  const [role, setRole] = useState(initial.person?.role ?? "");
  const [takeaways, setTakeaways] = useState(joinList(initial.takeaways));
  const [personal, setPersonal] = useState(joinList(initial.personal));
  const [followups, setFollowups] = useState(joinList(initial.followups));
  const [subject, setSubject] = useState(initial.draftEmail?.subject ?? "");
  const [body, setBody] = useState(initial.draftEmail?.body ?? "");

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
