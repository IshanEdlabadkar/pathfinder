// src/app/students/[id]/page.tsx

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentCounselor } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotesForm from "@/components/NotesForm";
import BriefingView from "@/components/BriefingView";
import StudentChat from "@/components/StudentChat";
import StudentEditForm from "@/components/StudentEditForm";
import CollegeListEditor from "@/components/CollegeListEditor";
import ActionItemEditor from "@/components/ActionItemEditor";
import DeleteStudentButton, { ExportReportButton } from "@/components/DeleteStudentButton";
import AddNoteForm from "@/components/AddNoteForm";
import CalendarView from "@/components/CalendarView";
import EssayTracker from "@/components/EssayTracker";


function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      },
      counselor_notes: {
        orderBy: { created_at: "desc" },
      },
      essays: {
        include: { school: true },
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!student || student.counselor_id !== counselor.id) {
    notFound();
  }

  student.college_lists.sort((a: any, b: any) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  student.action_items.sort((a: any, b: any) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back
            </a>
            <Separator orientation="vertical" className="h-4" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-xs text-muted-foreground">
                Grade {student.grade}
                {student.intended_major && ` \u00b7 ${student.intended_major}`}
                {student.gpa && ` \u00b7 ${student.gpa} GPA`}
              </p>
            </div>
          </div>
          <ExportReportButton studentId={student.id} />
          <DeleteStudentButton
            studentId={student.id}
            studentName={`${student.first_name} ${student.last_name}`}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <StudentEditForm
          student={{
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            grade: student.grade,
            gpa: student.gpa,
            test_scores: student.test_scores as Record<string, any> | null,
            intended_major: student.intended_major,
            extracurriculars: student.extracurriculars,
            family_context: student.family_context,
          }}
        />

        <BriefingView studentId={student.id} counselorId={counselor.id} />

        <StudentChat
          studentId={student.id}
          counselorId={counselor.id}
          studentName={student.first_name}
        />

        <Tabs defaultValue="college-list">
          <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-4 px-0">
            <TabsTrigger
              value="college-list"
              className="rounded-none border-b-2 border-transparent px-0 pb-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Schools ({student.college_lists.length})
            </TabsTrigger>
            <TabsTrigger
              value="action-items"
              className="rounded-none border-b-2 border-transparent px-0 pb-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Tasks ({student.action_items.length})
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="rounded-none border-b-2 border-transparent px-0 pb-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Sessions ({student.sessions.length})
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="rounded-none border-b-2 border-transparent px-0 pb-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Notes ({student.counselor_notes.length}) 
            </TabsTrigger>
            <TabsTrigger
              value="essays"
              className="rounded-none border-b-2 border-transparent px-0 pb-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Essays ({student.essays.length})
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="rounded-none border-b-2 border-transparent px-0 pb-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="college-list" className="mt-4">
            <CollegeListEditor
              entries={student.college_lists.map((cl: any) => ({
                id: cl.id,
                school: { name: cl.school.name },
                classification: cl.classification,
                application_round: cl.application_round,
                status: cl.status,
                deadline: cl.deadline,
                notes: cl.notes,
              }))}
              studentId={student.id}
              counselorId={counselor.id}
            />
          </TabsContent>
          <TabsContent value="calendar" className="mt-4">
            <CalendarView counselorId={counselor.id} studentId={student.id} />
          </TabsContent>
          <TabsContent value="action-items" className="mt-4">
            <ActionItemEditor
              items={student.action_items.map((ai: any) => ({
                id: ai.id,
                description: ai.description,
                due_date: ai.due_date,
                status: ai.status,
                college_list: ai.college_list
                  ? { school: { name: ai.college_list.school.name } }
                  : null,
              }))}
              studentId={student.id}
              counselorId={counselor.id}
            />
          </TabsContent>
          
          <TabsContent value="essays" className="mt-4">
            <EssayTracker
              essays={student.essays.map((e: any) => ({
                id: e.id,
                title: e.title,
                prompt: e.prompt,
                word_limit: e.word_limit,
                status: e.status,
                doc_link: e.doc_link,
                notes: e.notes,
                school: e.school ? { name: e.school.name } : null,
              }))}
              studentId={student.id}
              counselorId={counselor.id}
              schools={student.college_lists.map((cl: any) => cl.school.name)}
            />
          </TabsContent>

          <TabsContent value="sessions" className="mt-4 space-y-4">
            <NotesForm studentId={student.id} counselorId={counselor.id} />

            {student.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sessions recorded.
              </p>
            ) : (
              <div className="space-y-4">
                {student.sessions.map((session: any) => (
                  <div key={session.id} className="border-b pb-4 last:border-0">
                    <p className="text-sm font-medium">
                      {formatDate(session.date)}
                    </p>
                    {session.parsed_summary && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {session.parsed_summary}
                      </p>
                    )}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Raw notes
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {session.raw_notes}
                      </p>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <AddNoteForm studentId={student.id} counselorId={counselor.id} /> 
            {student.counselor_notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {student.counselor_notes.map((note: any) => (
                  <div key={note.id} className="border-b pb-3 last:border-0">
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(note.created_at)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}