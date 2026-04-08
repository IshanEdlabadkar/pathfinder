// src/app/api/college-list/route.ts

import { prisma } from "@/lib/prisma";
import { resolveSchool } from "@/lib/schoolResolver";
import { enrichCollegeListEntry } from "@/lib/schoolEnricher";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const school = await resolveSchool(prisma, data.school_name);

    const existing = await prisma.collegeList.findUnique({
      where: {
        student_id_school_id: {
          student_id: data.student_id,
          school_id: school.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "School already on list" },
        { status: 400 }
      );
    }

    const entry = await prisma.collegeList.create({
      data: {
        student_id: data.student_id,
        school_id: school.id,
        counselor_id: data.counselor_id,
        classification: data.classification || "TARGET",
        application_round: data.application_round || "RD",
        status: "NOT_STARTED",
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });

    // Enrich in background
    enrichCollegeListEntry(entry.id, data.application_round || "RD").catch(
      console.error
    );

    return NextResponse.json({ success: true, entry });
  } catch (err: any) {
    console.error("College list create error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}