// src/app/api/chat/route.ts

import { chatCompletion } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { DEFAULT_MODEL } from "@/lib/models";



// src/app/api/chat/route.ts

const CHAT_SYSTEM_PROMPT = `You are a college counseling assistant with deep expertise in college admissions. A counselor is asking you questions about a specific student. You have access to the student's complete record:

- Profile: name, grade, GPA, test scores, intended major, extracurriculars, family context
- College list: every school they're applying to with classification, round, status, deadlines, and notes
- Session history: all raw notes and parsed summaries from past sessions
- Action items: all tasks with statuses and due dates
- Counselor notes: additional observations

When answering questions:
1. Cross-reference ALL available data, not just session notes. If asked about extracurriculars, look at the student's activities AND their college list to assess fit.
2. Provide specific, actionable advice grounded in the student's actual data. Reference specific schools, activities, scores, and deadlines by name.
3. If the counselor asks whether something "needs work," evaluate it against the competitiveness of the schools on their list. A 3.8 GPA is strong for some schools and below median for others.
4. Be honest about gaps or weaknesses you see in the student's profile relative to their target schools.
5. If the data doesn't contain enough information to answer fully, say what you can determine and what additional information would help.

Keep responses concise but substantive. The counselor wants expert analysis, not generic advice.`;

export async function POST(req: Request) {
  const { studentId, counselorId, question } = await req.json();

  if (!studentId || !counselorId || !question) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        college_lists: {
          include: { school: true },
        },
        action_items: {
          include: { college_list: { include: { school: true } } },
        },
        sessions: {
          orderBy: { date: "desc" },
        },
        counselor_notes: {
          orderBy: { created_at: "desc" },
        },
        essays: {
          include: { school: true },
        },
      },
    });

    if (!student || student.counselor_id !== counselorId) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    const userMessage = `TODAY'S DATE: ${today}

STUDENT: ${student.first_name} ${student.last_name}
Grade: ${student.grade} | GPA: ${student.gpa} | Major: ${student.intended_major || "Undecided"}
Test Scores: ${student.test_scores ? JSON.stringify(student.test_scores) : "None"}
Extracurriculars: ${student.extracurriculars || "None"}
Family Context: ${student.family_context || "None"}

COLLEGE LIST:
${student.college_lists.map((cl: any) => `- ${cl.school.name} | ${cl.classification} | ${cl.application_round} | ${cl.status} | Deadline: ${cl.deadline?.toISOString().split("T")[0] || "None"} | Notes: ${cl.notes || "None"}`).join("\n") || "Empty"}

ACTION ITEMS:
${student.action_items.map((ai: any) => `- ${ai.description} | Due: ${ai.due_date?.toISOString().split("T")[0] || "None"} | Status: ${ai.status} | School: ${ai.college_list?.school?.name || "General"}`).join("\n") || "None"}

SESSION HISTORY (newest first):
${student.sessions.map((s: any) => `--- ${s.date.toISOString().split("T")[0]} ---\nRaw Notes: ${s.raw_notes}\nSummary: ${s.parsed_summary || "None"}`).join("\n\n") || "No sessions"}

COUNSELOR NOTES:
${student.counselor_notes.map((n: any) => `- ${n.created_at.toISOString().split("T")[0]}: ${n.content}`).join("\n") || "None"}

ESSAYS:
${student.essays.map((e: any) => `- ${e.title} | School: ${e.school?.name || "General"} | Status: ${e.status} | Doc: ${e.doc_link || "None"} | Prompt: ${e.prompt || "None"}`).join("\n") || "None"}

COUNSELOR'S QUESTION:
${question}`;

    const answer = await chatCompletion({
      model: DEFAULT_MODEL,
      systemPrompt: CHAT_SYSTEM_PROMPT,
      userMessage,
    });

    return NextResponse.json({ success: true, answer });
  } catch (err: any) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}