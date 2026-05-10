import { NextRequest, NextResponse } from "next/server";
import { getGmail, getSheetId, getSheetTab, getSheets } from "@/lib/google";

export const runtime = "nodejs";
export const maxDuration = 60;

type SaveBody = {
  transcript: string;
  recipient: string;
  person: { name: string; company: string; role: string };
  takeaways: string[];
  personal: string[];
  followups: string[];
  draftEmail: { subject: string; body: string };
};

function encodeSubject(s: string): string {
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  const b64 = Buffer.from(s, "utf-8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

function buildMime(args: {
  to: string;
  from: string;
  subject: string;
  body: string;
}): string {
  const headers = [
    `To: ${args.to}`,
    `From: ${args.from}`,
    `Subject: ${encodeSubject(args.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
  ].join("\r\n");
  return `${headers}\r\n\r\n${args.body}`;
}

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function joinBullets(items: string[]): string {
  return items.map((i) => `• ${i}`).join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SaveBody>;
    if (!body.recipient || !body.draftEmail || !body.person) {
      return NextResponse.json(
        { error: "Missing required fields (recipient, draftEmail, person)" },
        { status: 400 }
      );
    }

    const userEmail = process.env.USER_EMAIL;
    if (!userEmail)
      throw new Error("USER_EMAIL is not set in .env.local");

    const sheetId = getSheetId();
    const tab = getSheetTab();
    const sheets = getSheets();
    const gmail = getGmail();

    const mime = buildMime({
      to: body.recipient,
      from: userEmail,
      subject: body.draftEmail.subject,
      body: body.draftEmail.body,
    });
    const raw = base64url(Buffer.from(mime, "utf-8"));

    const draft = await gmail.users.drafts.create({
      userId: "me",
      requestBody: { message: { raw } },
    });
    const draftId = draft.data.id ?? "";
    const messageId = draft.data.message?.id ?? "";

    const now = new Date().toISOString();
    const row = [
      now,
      body.person.name ?? "",
      body.person.company ?? "",
      body.person.role ?? "",
      joinBullets(body.takeaways ?? []),
      joinBullets(body.personal ?? []),
      joinBullets(body.followups ?? []),
      `Subject: ${body.draftEmail.subject}\n\n${body.draftEmail.body}`,
      `Draft created (${draftId})`,
      body.transcript ?? "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: tab,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    const draftUrl = messageId
      ? `https://mail.google.com/mail/u/0/#drafts/${messageId}`
      : "https://mail.google.com/mail/u/0/#drafts";

    return NextResponse.json({ sheetUrl, draftUrl, draftId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/save] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
