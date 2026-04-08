// src/app/api/scheduled-events/route.ts

import { prisma } from "@/lib/prisma";
import { getCurrentCounselor } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const counselor = await getCurrentCounselor();
    const data = await req.json();

    if (!data.title || !data.date) {
      return NextResponse.json(
        { success: false, error: "Title and date required" },
        { status: 400 }
      );
    }

    const event = await prisma.scheduledEvent.create({
      data: {
        counselor_id: counselor.id,
        student_id: data.student_id || null,
        title: data.title,
        date: new Date(data.date),
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error("Create scheduled event error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}