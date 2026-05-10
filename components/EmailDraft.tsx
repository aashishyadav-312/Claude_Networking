"use client";

type Props = {
  subject: string;
  body: string;
  onSubjectChange: (v: string) => void;
  onBodyChange: (v: string) => void;
};

export default function EmailDraft({
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
      <h3 className="text-md font-semibold">Draft email</h3>

      <label className="flex flex-col text-sm">
        <span className="font-medium text-gray-700">Subject</span>
        <input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="mt-1 rounded border border-gray-300 bg-white p-2"
        />
      </label>

      <label className="flex flex-col text-sm">
        <span className="font-medium text-gray-700">Body</span>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={10}
          className="mt-1 rounded border border-gray-300 bg-white p-2 font-mono text-sm"
        />
      </label>
    </div>
  );
}
