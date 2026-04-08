// src/agents/noteParser/parse.ts

import { chatCompletion, parseJsonResponse } from "@/lib/openrouter";
import { NOTE_PARSER_SYSTEM_PROMPT } from "./prompt";
import { prisma } from "@/lib/prisma";
import { Changeset } from "@/types/changeset";

const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export async function parseSessionNotes({
  studentId,
  counselorId,
  rawNotes,
}: {
  studentId: string;
  counselorId: string;
  rawNotes: string;
}): Promise<{ parsedSummary: string; changeset: Changeset }> {
  // Pull student context
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      college_lists: { include: { school: true } },
      action_items: {
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        include: { college_list: { include: { school: true } } },
      },
      sessions: {
        orderBy: { date: "desc" },
        take: 3,
        select: { date: true, parsed_summary: true },
      },
      essays: {
        include: { school: true },
      },
    },
  });

  if (!student) throw new Error("Student not found");

  const today = new Date().toISOString().split("T")[0];

  const userMessage = `TODAY'S DATE: ${today}

STUDENT PROFILE:
- ID: ${student.id}
- Name: ${student.first_name} ${student.last_name}
- Grade: ${student.grade}
- GPA: ${student.gpa}
- Intended Major: ${student.intended_major || "Undecided"}
- Extracurriculars: ${student.extracurriculars || "None listed"}
- Family Context: ${student.family_context || "None noted"}

CURRENT COLLEGE LIST:
${student.college_lists.map((cl: any) => `- ${cl.school.name} | ${cl.classification} | ${cl.application_round} | ${cl.status} | Deadline: ${cl.deadline?.toISOString().split("T")[0] || "None"} | Notes: ${cl.notes || "None"}`).join("\n") || "Empty"}

CURRENT OPEN ACTION ITEMS:
${student.action_items.map((ai: any) => `- ID: ${ai.id} | ${ai.description} | Due: ${ai.due_date?.toISOString().split("T")[0] || "None"} | Status: ${ai.status} | School: ${ai.college_list?.school?.name || "General"}`).join("\n") || "None"}

CURRENT ESSAYS:
${student.essays.map((e: any) => `- ID: ${e.id} | ${e.title} | School: ${e.school?.name || "General"} | Status: ${e.status} | Doc: ${e.doc_link || "None"} | Prompt: ${e.prompt || "None"}`).join("\n") || "None"}

RECENT SESSION SUMMARIES:
${student.sessions.map((s: any) => `- ${s.date.toISOString().split("T")[0]}: ${s.parsed_summary || "No summary"}`).join("\n") || "No prior sessions"}

RAW SESSION NOTES:
${rawNotes}`;

  const raw = await chatCompletion({
    model: MODEL,
    systemPrompt: NOTE_PARSER_SYSTEM_PROMPT,
    userMessage,
  });

  const parsed = parseJsonResponse(raw);

  // Inject student_id into all operations that need it
  const changeset: Changeset = (parsed.operations || [])
    .filter((op: any) => op && op.type && op.entity && op.data)
    .map((op: any) => ({
      type: op.type,
      entity: op.entity,
      data: {
        ...op.data,
        student_id: op.data.student_id || studentId,
      },
    }));

  return {
    parsedSummary: parsed.parsed_summary,
    changeset,
  };
}