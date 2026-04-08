// src/app/api/students/route.ts

import { prisma } from "@/lib/prisma";
import { getCurrentCounselor } from "@/lib/auth";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const counselor = await getCurrentCounselor();
    const data = await req.json();

    if (!data.first_name || !data.last_name) {
      return NextResponse.json(
        { success: false, error: "First and last name required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        counselor_id: counselor.id,
        first_name: data.first_name,
        last_name: data.last_name,
        grade: data.grade || 12,
        gpa: data.gpa || null,
        test_scores: data.test_scores || null,
        intended_major: data.intended_major || null,
        extracurriculars: data.extracurriculars || null,
        family_context: data.family_context || null,
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (err: any) {
    console.error("Create student error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
// src/app/api/students/[id]/route.ts — add the DELETE handler

// Add this to the existing file that already has the PATCH handler

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const counselor = await getCurrentCounselor();

    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student || student.counselor_id !== counselor.id) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    await prisma.student.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete student error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}