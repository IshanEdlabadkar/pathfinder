// src/app/api/essays/route.ts

import { prisma } from "@/lib/prisma";
import { getCurrentCounselor } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const counselor = await getCurrentCounselor();
    const data = await req.json();

    if (!data.student_id || !data.title) {
      return NextResponse.json(
        { success: false, error: "Student and title required" },
        { status: 400 }
      );
    }

    // Resolve school if provided
    let schoolId = null;
    if (data.school_name) {
      const school = await prisma.school.findFirst({
        where: { name: { equals: data.school_name, mode: "insensitive" } },
      });
      schoolId = school?.id || null;
    }

    const essay = await prisma.essay.create({
      data: {
        student_id: data.student_id,
        counselor_id: counselor.id,
        school_id: schoolId,
        title: data.title,
        prompt: data.prompt || null,
        word_limit: data.word_limit ? parseInt(data.word_limit) : null,
        doc_link: data.doc_link || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ success: true, essay });
  } catch (err: any) {
    console.error("Create essay error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}