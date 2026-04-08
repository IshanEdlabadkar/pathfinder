import { parseSessionNotes } from "@/agents/noteParser/parse";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { studentId, counselorId, rawNotes } = await req.json();

  if (!studentId || !counselorId || !rawNotes) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const { parsedSummary, changeset } = await parseSessionNotes({
      studentId,
      counselorId,
      rawNotes,
    });

    return NextResponse.json({ success: true, parsedSummary, changeset });
  } catch (err: any) {
    console.error("Parse notes error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}