// src/app/api/students/[id]/report/route.ts

import { prisma } from "@/lib/prisma";
import { getCurrentCounselor } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const counselor = await getCurrentCounselor();

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      college_lists: {
        include: { school: true },
        orderBy: { deadline: "asc" },
      },
      action_items: {
        orderBy: { due_date: "asc" },
        include: { college_list: { include: { school: true } } },
      },
      sessions: {
        orderBy: { date: "desc" },
        take: 5,
      },
      counselor_notes: {
        orderBy: { created_at: "desc" },
        take: 10,
      },
    },
  });

  if (!student || student.counselor_id !== counselor.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const today = new Date();
  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const testScoresStr = student.test_scores
    ? Object.entries(student.test_scores as Record<string, any>)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
        .join(" &middot; ")
    : "None recorded";

  const collegeRows = student.college_lists
    .map((cl: any) => {
      const deadline = cl.deadline ? formatDate(cl.deadline) : "&mdash;";
      return `<tr>
        <td>${cl.school.name}</td>
        <td>${cl.classification}</td>
        <td>${cl.application_round}</td>
        <td>${cl.status.replace(/_/g, " ")}</td>
        <td>${deadline}</td>
      </tr>`;
    })
    .join("");

  const actionRows = student.action_items
    .filter((ai: any) => ai.status !== "COMPLETE")
    .map((ai: any) => {
      const due = ai.due_date ? formatDate(ai.due_date) : "&mdash;";
      const isOverdue =
        ai.due_date && new Date(ai.due_date) < today ? " (OVERDUE)" : "";
      return `<tr>
        <td>${ai.description}</td>
        <td>${ai.status.replace(/_/g, " ")}${isOverdue}</td>
        <td>${due}</td>
        <td>${ai.college_list?.school?.name || "&mdash;"}</td>
      </tr>`;
    })
    .join("");

  const sessionsHtml = student.sessions
    .map(
      (s: any) =>
        `<div class="session">
          <strong>${formatDate(s.date)}</strong>
          <p>${s.parsed_summary || s.raw_notes.slice(0, 300)}${s.raw_notes.length > 300 ? "..." : ""}</p>
        </div>`
    )
    .join("");

  const notesHtml = student.counselor_notes
    .map(
      (n: any) =>
        `<div class="note">
          <strong>${formatDate(n.created_at)}</strong>
          <p>${n.content}</p>
        </div>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${student.first_name} ${student.last_name} — Student Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 32px; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 2px; }
    h2 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin: 28px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #e5e5e5; }
    .subtitle { font-size: 13px; color: #666; margin-bottom: 24px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .meta-item label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.03em; }
    .meta-item p { font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { text-align: left; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.03em; padding: 6px 8px; border-bottom: 1px solid #e5e5e5; }
    td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    .session, .note { margin-bottom: 12px; }
    .session strong, .note strong { font-size: 12px; color: #666; }
    .session p, .note p { margin-top: 2px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999; }
    @media print {
      body { padding: 20px; }
      h2 { break-after: avoid; }
      table { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${student.first_name} ${student.last_name}</h1>
  <p class="subtitle">Grade ${student.grade}${student.intended_major ? ` &middot; ${student.intended_major}` : ""}${student.gpa ? ` &middot; ${student.gpa} GPA` : ""}</p>

  <div class="meta">
    <div class="meta-item">
      <label>Test Scores</label>
      <p>${testScoresStr}</p>
    </div>
    <div class="meta-item">
      <label>Extracurriculars</label>
      <p>${student.extracurriculars || "None listed"}</p>
    </div>
    <div class="meta-item">
      <label>Family Context</label>
      <p>${student.family_context || "None noted"}</p>
    </div>
  </div>

  <h2>College List (${student.college_lists.length})</h2>
  ${
    student.college_lists.length > 0
      ? `<table>
          <thead><tr><th>School</th><th>Type</th><th>Round</th><th>Status</th><th>Deadline</th></tr></thead>
          <tbody>${collegeRows}</tbody>
        </table>`
      : "<p>No schools added yet.</p>"
  }

  <h2>Open Action Items</h2>
  ${
    actionRows
      ? `<table>
          <thead><tr><th>Task</th><th>Status</th><th>Due</th><th>School</th></tr></thead>
          <tbody>${actionRows}</tbody>
        </table>`
      : "<p>No open items.</p>"
  }

  <h2>Recent Sessions</h2>
  ${sessionsHtml || "<p>No sessions recorded.</p>"}

  ${
    notesHtml
      ? `<h2>Counselor Notes</h2>${notesHtml}`
      : ""
  }

  <div class="footer">
    Generated ${formatDate(today)} by ${counselor.name} &middot; PathFinder
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}