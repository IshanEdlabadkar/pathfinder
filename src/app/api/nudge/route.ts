// src/app/api/nudge/route.ts

import { chatCompletion } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { DEFAULT_MODEL } from "@/lib/models";

const NUDGE_PROMPT = `You are a college counselor's assistant. Draft a short, friendly reminder message from the counselor to a student about an overdue or upcoming task.

You will receive the student's name, the task description, how many days overdue it is (if applicable), and any relevant context like the school it relates to.

Write a message that:
- Is warm but direct — not passive aggressive
- Mentions the specific task
- If overdue, acknowledges it without shaming
- Suggests a concrete next step or offers help
- Is 2-4 sentences max
- Sounds like a real person, not a bot

Output ONLY the message text. No greeting line, no sign-off, no subject line — just the body. The counselor will add their own greeting and signature.`;

export async function POST(req: Request) {
  const { actionItemId, counselorId } = await req.json();

  if (!actionItemId || !counselorId) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const actionItem = await prisma.actionItem.findUnique({
      where: { id: actionItemId },
      include: {
        student: true,
        college_list: { include: { school: true } },
      },
    });

    if (!actionItem) {
      return NextResponse.json(
        { success: false, error: "Action item not found" },
        { status: 404 }
      );
    }

    const today = new Date();
    const dueDate = actionItem.due_date ? new Date(actionItem.due_date) : null;
    const daysOverdue = dueDate
      ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const context = `Student: ${actionItem.student.first_name} ${actionItem.student.last_name}
Task: ${actionItem.description}
Status: ${actionItem.status}
${dueDate ? `Due date: ${dueDate.toLocaleDateString()}` : "No due date set"}
${daysOverdue !== null && daysOverdue > 0 ? `Days overdue: ${daysOverdue}` : ""}
${actionItem.college_list?.school ? `Related school: ${actionItem.college_list.school.name}` : ""}
${actionItem.student.intended_major ? `Student's intended major: ${actionItem.student.intended_major}` : ""}`;

    const message = await chatCompletion({
      model: DEFAULT_MODEL,
      systemPrompt: NUDGE_PROMPT,
      userMessage: context,
    });

    return NextResponse.json({
      success: true,
      message: message.trim(),
      studentName: actionItem.student.first_name,
    });
  } catch (err: any) {
    console.error("Nudge generation error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}