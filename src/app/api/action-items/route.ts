// src/app/api/action-items/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const item = await prisma.actionItem.create({
      data: {
        student_id: data.student_id,
        counselor_id: data.counselor_id,
        description: data.description,
        due_date: data.due_date ? new Date(data.due_date) : null,
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    console.error("Action item create error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}