import { NextRequest, NextResponse } from "next/server";
import { getSheetId, getSheetTab, getSheets } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

function rowFromValues(v: string[]): Row {
  return {
    date: v[0] ?? "",
    name: v[1] ?? "",
    company: v[2] ?? "",
    role: v[3] ?? "",
    takeaways: v[4] ?? "",
    personal: v[5] ?? "",
    followups: v[6] ?? "",
    draftEmail: v[7] ?? "",
    emailStatus: v[8] ?? "",
    transcript: v[9] ?? "",
  };
}

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
    const sheetId = getSheetId();
    const tab = getSheetTab();

    const sheets = getSheets();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: tab,
    });

    const all = (result.data.values ?? []) as string[][];
    const dataRows = all.slice(1).map(rowFromValues);

    const filtered = q
      ? dataRows.filter((r) =>
          Object.values(r).some((v) =>
            (v ?? "").toString().toLowerCase().includes(q)
          )
        )
      : dataRows;

    filtered.reverse();

    return NextResponse.json({ rows: filtered });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/search] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
