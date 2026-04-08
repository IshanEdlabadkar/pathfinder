// src/app/dashboard/page.tsx

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentCounselor } from "@/lib/auth";
import AddStudentButton from "@/components/AddStudentButton";
import UpcomingWeek from "@/components/UpcomingWeek";
import PriorityQueue from "@/components/PriorityQueue";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor(
    (startOfDay(b).getTime() - startOfDay(a).getTime()) / msPerDay
  );
}

export default async function DashboardPage() {
  const counselor = await getCurrentCounselor();

  const students = await prisma.student.findMany({
    where: { counselor_id: counselor.id },
    include: {
      action_items: true,
      sessions: {
        orderBy: { date: "desc" },
        take: 1,
      },
      college_lists: true,
    },
    orderBy: { last_name: "asc" },
  });

  const today = startOfDay(new Date());

  const enriched = students.map((s: any) => {
    const overdueItems = s.action_items.filter(
      (ai: any) =>
        ai.status !== "COMPLETE" &&
        ai.due_date &&
        startOfDay(new Date(ai.due_date)) < today
    );

    const lastSession = s.sessions[0]?.date ?? null;
    const daysSinceSession =
      lastSession !== null
        ? daysBetween(new Date(lastSession), new Date())
        : null;

    const upcomingDeadlines = s.college_lists
      .filter(
        (cl: any) => cl.deadline && startOfDay(new Date(cl.deadline)) >= today
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );

    const nextDeadline = upcomingDeadlines[0]?.deadline ?? null;
    const daysUntilDeadline =
      nextDeadline !== null
        ? daysBetween(new Date(), new Date(nextDeadline))
        : null;

    let priority = 0;
    priority += overdueItems.length * 3;
    if (daysSinceSession !== null && daysSinceSession > 14) priority += 2;
    if (daysSinceSession !== null && daysSinceSession > 28) priority += 3;
    if (daysUntilDeadline !== null && daysUntilDeadline < 14) priority += 2;
    if (daysUntilDeadline !== null && daysUntilDeadline < 7) priority += 3;

    return {
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      grade: s.grade,
      intended_major: s.intended_major,
      overdueCount: overdueItems.length,
      lastSession,
      daysSinceSession,
      nextDeadline,
      daysUntilDeadline,
      priority,
    };
  });

  enriched.sort((a: any, b: any) => b.priority - a.priority);

  const totalOverdue = enriched.reduce(
    (sum: number, s: any) => sum + s.overdueCount,
    0
  );
  const deadlineSoon = enriched.filter(
    (s: any) => s.daysUntilDeadline !== null && s.daysUntilDeadline <= 30
  ).length;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">PathFinder</h1>
            <p className="text-sm text-muted-foreground">
              {counselor.name} &middot;{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/calendar" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Calendar</a>
            <AddStudentButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8 flex gap-8">
          <div>
            <p className="text-3xl font-semibold tracking-tight">
              {students.length}
            </p>
            <p className="text-xs text-muted-foreground">Students</p>
          </div>
          <div>
            <p className={`text-3xl font-semibold tracking-tight ${totalOverdue > 0 ? "text-red-600" : ""}`}>
              {totalOverdue}
            </p>
            <p className="text-xs text-muted-foreground">Overdue items</p>
          </div>
          <div>
            <p className={`text-3xl font-semibold tracking-tight ${deadlineSoon > 0 ? "text-amber-600" : ""}`}>
              {deadlineSoon}
            </p>
            <p className="text-xs text-muted-foreground">Deadlines in 30 days</p>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            This week
          </p>
          <UpcomingWeek />
        </div>

        <PriorityQueue students={enriched} />
      </main>
    </div>
  );
}