// src/agents/briefing/generate.ts

import { chatCompletion, parseJsonResponse } from "@/lib/openrouter";
import { BRIEFING_SYSTEM_PROMPT } from "./prompt";
import { prisma } from "@/lib/prisma";


const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export interface Briefing {
  student_summary: string;
  since_last_session: string[];
  overdue_items: string[];
  upcoming_deadlines: string[];
  school_updates: string[];
  suggested_focus: string;
}

export async function generateBriefing({
  studentId,
  counselorId,
}: {
  studentId: string;
  counselorId: string;
}): Promise<Briefing> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      college_lists: { include: { school: true } },
      action_items: {
        include: { college_list: { include: { school: true } } },
      },
      sessions: {
        orderBy: { date: "desc" },
        take: 5,
        select: { date: true, raw_notes: true, parsed_summary: true },
      },
      essays: {
        include: { school: true },
      },
      counselor_notes: {
        orderBy: { created_at: "desc" },
        take: 10,
      },
    },
  });

  if (!student) throw new Error("Student not found");

  const today = new Date().toISOString().split("T")[0];

  // Gather cached school research
  const schoolIds = student.college_lists.map((cl: any) => cl.school_id);
  const schools = await prisma.school.findMany({
    where: { id: { in: schoolIds } },
    select: { name: true, research_cache: true, research_updated_at: true },
  });

  const researchContext = schools
    .filter((s: any) => s.research_cache)
    .map((s: any) => `${s.name} (updated ${s.research_updated_at?.toISOString().split("T")[0] || "unknown"}):\n${JSON.stringify(s.research_cache)}`)
    .join("\n\n");

  const userMessage = `TODAY'S DATE: ${today}

STUDENT PROFILE:
- Name: ${student.first_name} ${student.last_name}
- Grade: ${student.grade}
- GPA: ${student.gpa}
- Intended Major: ${student.intended_major || "Undecided"}
- Extracurriculars: ${student.extracurriculars || "None listed"}
- Family Context: ${student.family_context || "None noted"}

COLLEGE LIST:
${student.college_lists.map((cl: any) => `- ${cl.school.name} | ${cl.classification} | ${cl.application_round} | ${cl.status} | Deadline: ${cl.deadline?.toISOString().split("T")[0] || "None"} | Notes: ${cl.notes || "None"}`).join("\n") || "Empty"}

ALL ACTION ITEMS:
${student.action_items.map((ai: any) => `- ${ai.description} | Due: ${ai.due_date?.toISOString().split("T")[0] || "None"} | Status: ${ai.status} | School: ${ai.college_list?.school?.name || "General"}`).join("\n") || "None"}

SESSION HISTORY:
${student.sessions.map((s: any) => `- ${s.date.toISOString().split("T")[0]}: ${s.parsed_summary || s.raw_notes.slice(0, 200)}`).join("\n") || "No prior sessions"}

COUNSELOR NOTES:
${student.counselor_notes.map((n: any) => `- ${n.created_at.toISOString().split("T")[0]}: ${n.content}`).join("\n") || "None"}

ESSAYS:
${student.essays.map((e: any) => `- ${e.title} | School: ${e.school?.name || "General"} | Status: ${e.status} | Doc: ${e.doc_link || "None"}`).join("\n") || "None"}

SCHOOL RESEARCH:
${researchContext || "No cached research available"}`;

  const raw = await chatCompletion({
    model: MODEL,
    systemPrompt: BRIEFING_SYSTEM_PROMPT,
    userMessage,
  });

  return parseJsonResponse(raw);
}