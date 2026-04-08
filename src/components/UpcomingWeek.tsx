// src/components/UpcomingWeek.tsx

"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface CalendarEvent {
  id: string;
  type: "session" | "task" | "deadline" | "scheduled";
  date: string;
  title: string;
  studentId: string;
  studentName: string;
  detail: string | null;
  status?: string;
  deletable?: boolean;
}

export default function UpcomingWeek() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    fetch(
      `/api/calendar?from=${today.toISOString()}&to=${nextWeek.toISOString()}`
    )
      .then((res) => {
        if (!res.ok) return { success: false, events: [] };
        return res.json();
      })
      .then((data) => {
        if (data.success) setEvents(data.events);
      })
      .catch((err) => console.error("Calendar fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground">Loading upcoming...</p>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Nothing due this week.</p>
    );
  }

  const typeColors: Record<string, string> = {
    session: "default",
    task: "secondary",
    deadline: "destructive",
    scheduled: "outline",
  };

  const typeLabels: Record<string, string> = {
    session: "Session",
    task: "Task",
    deadline: "Deadline",
    scheduled: "Event",
  };

  function formatDay(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dDate = new Date(d);
    dDate.setHours(0, 0, 0, 0);

    if (dDate.getTime() === today.getTime()) return "Today";
    if (dDate.getTime() === tomorrow.getTime()) return "Tomorrow";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const grouped: Record<string, CalendarEvent[]> = {};
  for (const evt of events) {
    const day = new Date(evt.date).toISOString().split("T")[0];
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(evt);
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([day, dayEvents]) => (
        <div key={day}>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {formatDay(dayEvents[0].date)}
          </p>
          <div className="space-y-1">
            {dayEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50 transition-colors"
              >
                {evt.studentId ? (
                    <a
                    href={`/students/${evt.studentId}`}
                    className="flex items-center gap-2 min-w-0 flex-1"
                  >
                    <Badge
                      variant={typeColors[evt.type] as any}
                      className="text-[9px] px-1 py-0 shrink-0"
                    >
                      {typeLabels[evt.type]}
                    </Badge>
                    <span className="text-sm truncate">{evt.title}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge
                      variant={typeColors[evt.type] as any}
                      className="text-[9px] px-1 py-0 shrink-0"
                    >
                      {typeLabels[evt.type]}
                    </Badge>
                    <span className="text-sm truncate">{evt.title}</span>
                  </div>
                )}
                <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                  {evt.studentName}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}