// src/components/CalendarView.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function CalendarView({
  counselorId,
  studentId,
  students,
}: {
  counselorId: string;
  studentId?: string;
  students?: { id: string; name: string }[];
}) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addStudentId, setAddStudentId] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState("");

  function fetchEvents() {
    setLoading(true);
    const from = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const to = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    if (studentId) params.set("studentId", studentId);

    fetch(`/api/calendar?${params}`)
      .then((res) => {
        if (!res.ok) return { success: false, events: [] };
        return res.json();
      })
      .then((data) => {
        if (data.success) setEvents(data.events);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEvents();
  }, [currentMonth, studentId]);

  function prevMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
    setSelectedDay(null);
  }

  function goToday() {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(null);
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  async function handleAddEvent() {
    if (!addTitle.trim() || selectedDay === null) return;
    setAddLoading(true);
    setError("");

    const date = new Date(year, month, selectedDay, 12, 0, 0);

    try {
      const res = await fetch("/api/scheduled-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addTitle.trim(),
          date: date.toISOString(),
          student_id: addStudentId || studentId || null,
          notes: addNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      setAddOpen(false);
      setAddTitle("");
      setAddStudentId("");
      setAddNotes("");
      fetchEvents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteEvent(eventId: string, eventType: string) {
    const label = eventType === "deadline" ? "This will remove the school from the student's list." :
                  eventType === "session" ? "This will delete the session record." :
                  eventType === "task" ? "This will delete the action item." :
                  "This will delete the event.";

    if (!confirm(`Delete this ${eventType}? ${label}`)) return;

    try {
      const res = await fetch(`/api/scheduled-events/${eventId}?type=${eventType}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) week.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const eventsByDay: Record<number, CalendarEvent[]> = {};
  for (const evt of events) {
    const d = new Date(evt.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(evt);
    }
  }

  const dotColors: Record<string, string> = {
    session: "bg-blue-400",
    task: "bg-amber-400",
    deadline: "bg-red-400",
    scheduled: "bg-green-400",
  };

  const typeColors: Record<string, string> = {
    session: "bg-blue-100 text-blue-700",
    task: "bg-amber-100 text-amber-700",
    deadline: "bg-red-100 text-red-700",
    scheduled: "bg-green-100 text-green-700",
  };

  const typeLabels: Record<string, string> = {
    session: "Session",
    task: "Task",
    deadline: "Deadline",
    scheduled: "Event",
  };

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold tracking-tight">{monthName}</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            &larr;
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            &rarr;
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-7 border-b pb-2 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <p
                key={d}
                className="text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {weeks.map((w, wi) =>
              w.map((day, di) => {
                if (day === null) {
                  return (
                    <div key={`${wi}-${di}`} className="h-20 border-b" />
                  );
                }

                const dayDate = new Date(year, month, day);
                dayDate.setHours(0, 0, 0, 0);
                const isToday = dayDate.getTime() === today.getTime();
                const isPast = dayDate < today;
                const dayEvents = eventsByDay[day] || [];
                const isSelected = selectedDay === day;

                return (
                  <div
                    key={`${wi}-${di}`}
                    className={`h-20 border-b px-1 py-1 cursor-pointer transition-colors ${
                      isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                    } ${isPast && !isToday ? "opacity-50" : ""}`}
                    onClick={() =>
                      setSelectedDay(isSelected ? null : day)
                    }
                  >
                    <p
                      className={`text-xs text-right mb-0.5 ${
                        isToday
                          ? "font-bold text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isToday ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px]">
                          {day}
                        </span>
                      ) : (
                        day
                      )}
                    </p>
                    <div className="flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <span
                          key={evt.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            dotColors[evt.type]
                          }`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400" /> Sessions
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Tasks
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Deadlines
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400" /> Scheduled
            </span>
          </div>

          {selectedDay !== null && (
            <div className="mt-4 rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">
                  {new Date(year, month, selectedDay).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddOpen(true)}
                >
                  Schedule
                </Button>
              </div>

              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing scheduled.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between rounded px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                            typeColors[evt.type]
                          }`}
                        >
                          {typeLabels[evt.type]}
                        </span>
                        {evt.studentId ? (
                          <a href={`/students/${evt.studentId}`} className="text-sm truncate hover:underline">{evt.title}</a>
                        ) : (
                          <span className="text-sm truncate">
                            {evt.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">
                          {evt.studentName}
                        </span>
                        {evt.detail && (
                          <span className="text-xs text-muted-foreground">
                            {evt.detail}
                          </span>
                        )}
                        {evt.deletable && (
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.type)}
                            className="text-xs text-muted-foreground hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Schedule event &mdash;{" "}
              {selectedDay !== null &&
                new Date(year, month, selectedDay).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric" }
                )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <Input
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="e.g. Session with Maya, Parent meeting"
              />
            </div>
            {!studentId && students && students.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Student (optional)
                </label>
                <select
                  className="w-full rounded border px-2 py-1.5 text-sm"
                  value={addStudentId}
                  onChange={(e) => setAddStudentId(e.target.value)}
                >
                  <option value="">General — no student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Notes (optional)
              </label>
              <Input
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                placeholder="Any details"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddEvent}
                disabled={addLoading || !addTitle.trim()}
              >
                {addLoading ? "Saving..." : "Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}