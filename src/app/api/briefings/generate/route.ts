// src/app/api/briefings/generate/route.ts

import { generateBriefing } from "@/agents/briefing/generate";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { studentId, counselorId } = await req.json();

  if (!studentId || !counselorId) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const briefing = await generateBriefing({ studentId, counselorId });
    return NextResponse.json({ success: true, briefing });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}