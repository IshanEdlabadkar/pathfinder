// src/app/api/calendar/route.ts

import { prisma } from "@/lib/prisma";
import { getCurrentCounselor } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const counselor = await getCurrentCounselor();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const studentFilter = studentId
      ? { student_id: studentId, counselor_id: counselor.id }
      : { counselor_id: counselor.id };

    const dateFrom = from ? new Date(from) : new Date("2000-01-01");
    const dateTo = to ? new Date(to) : new Date("2100-01-01");

    const [sessions, actionItems, collegeLists, scheduledEvents] =
      await Promise.all([
        prisma.session.findMany({
          where: {
            ...studentFilter,
            date: { gte: dateFrom, lte: dateTo },
          },
          include: { student: true },
          orderBy: { date: "asc" },
        }),
        prisma.actionItem.findMany({
          where: {
            ...studentFilter,
            due_date: { not: null, gte: dateFrom, lte: dateTo },
            status: { not: "COMPLETE" },
          },
          include: {
            student: true,
            college_list: { include: { school: true } },
          },
          orderBy: { due_date: "asc" },
        }),
        prisma.collegeList.findMany({
          where: {
            ...studentFilter,
            deadline: { not: null, gte: dateFrom, lte: dateTo },
          },
          include: {
            student: true,
            school: true,
          },
          orderBy: { deadline: "asc" },
        }),
        prisma.scheduledEvent.findMany({
          where: {
            counselor_id: counselor.id,
            ...(studentId ? { student_id: studentId } : {}),
            date: { gte: dateFrom, lte: dateTo },
          },
          include: { student: true },
          orderBy: { date: "asc" },
        }),
      ]);

    const events = [
      ...sessions.map((s: any) => ({
        id: s.id,
        type: "session" as const,
        date: s.date.toISOString(),
        title: `Session: ${s.student.first_name} ${s.student.last_name}`,
        studentId: s.student_id,
        studentName: `${s.student.first_name} ${s.student.last_name}`,
        detail: s.parsed_summary || null,
        deletable: true,
      })),
      ...actionItems.map((ai: any) => ({
        id: ai.id,
        type: "task" as const,
        date: ai.due_date!.toISOString(),
        title: ai.description,
        studentId: ai.student_id,
        studentName: `${ai.student.first_name} ${ai.student.last_name}`,
        detail: ai.college_list?.school?.name || null,
        status: ai.status,
        deletable: true,
      })),
      ...collegeLists.map((cl: any) => ({
        id: cl.id,
        type: "deadline" as const,
        date: cl.deadline!.toISOString(),
        title: `${cl.school.name} — ${cl.application_round}`,
        studentId: cl.student_id,
        studentName: `${cl.student.first_name} ${cl.student.last_name}`,
        detail: cl.classification,
        status: cl.status,
        deletable: true,
      })),
      ...scheduledEvents.map((se: any) => ({
        id: se.id,
        type: "scheduled" as const,
        date: se.date.toISOString(),
        title: se.title,
        studentId: se.student_id || "",
        studentName: se.student
          ? `${se.student.first_name} ${se.student.last_name}`
          : "General",
        detail: se.notes,
        deletable: true,
      })),
    ];

    events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    console.error("Calendar error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}