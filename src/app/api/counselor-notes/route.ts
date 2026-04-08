// src/app/api/counselor-notes/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { student_id, counselor_id, content } = await req.json();

    if (!student_id || !counselor_id || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await prisma.counselorNote.create({
      data: { student_id, counselor_id, content: content.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}