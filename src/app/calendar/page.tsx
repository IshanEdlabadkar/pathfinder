// src/app/calendar/page.tsx

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentCounselor } from "@/lib/auth";
import CalendarView from "@/components/CalendarView";
import { Separator } from "@/components/ui/separator";

export default async function CalendarPage() {
  const counselor = await getCurrentCounselor();

  const students = await prisma.student.findMany({
    where: { counselor_id: counselor.id },
    select: { id: true, first_name: true, last_name: true },
    orderBy: { last_name: "asc" },
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Back</a>
            <Separator orientation="vertical" className="h-4" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Calendar</h1>
              <p className="text-xs text-muted-foreground">All deadlines, tasks, and sessions</p>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <CalendarView
          counselorId={counselor.id}
          students={students.map((s) => ({ id: s.id, name: `${s.first_name} ${s.last_name}` }))}
        />
      </main>
    </div>
  );
}