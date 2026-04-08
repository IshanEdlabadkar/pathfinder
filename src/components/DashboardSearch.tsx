// src/components/DashboardSearch.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface StudentSummary {
  id: string;
  first_name: string;
  last_name: string;
  grade: number;
  intended_major: string | null;
  overdueCount: number;
  daysSinceSession: number | null;
  daysUntilDeadline: number | null;
}

export default function DashboardSearch({
  students,
}: {
  students: StudentSummary[];
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? students.filter((s) => {
        const q = query.toLowerCase();
        return (
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
          (s.intended_major && s.intended_major.toLowerCase().includes(q))
        );
      })
    : students;

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Search students..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          {query ? "No students match your search." : "No students yet."}
        </p>
      ) : (
        <div className="space-y-1">
          {filtered.map((student) => (
            <Link
              key={student.id}
              href={`/students/${student.id}`}
              className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-muted-foreground">
                  {student.first_name[0]}
                  {student.last_name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {student.grade}th
                    {student.intended_major &&
                      ` \u00b7 ${student.intended_major}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {student.overdueCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {student.overdueCount} overdue
                  </Badge>
                )}
                {student.daysUntilDeadline !== null &&
                  student.daysUntilDeadline <= 30 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {student.daysUntilDeadline}d to deadline
                    </Badge>
                  )}
                <span className="text-[11px] text-muted-foreground w-28 text-right">
                  {student.daysSinceSession !== null
                    ? student.daysSinceSession === 0
                      ? "Today"
                      : `${student.daysSinceSession}d ago`
                    : "No sessions"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}