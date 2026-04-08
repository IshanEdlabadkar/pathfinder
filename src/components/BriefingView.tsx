// src/components/BriefingView.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Briefing {
  student_summary: string;
  since_last_session: string[];
  overdue_items: string[];
  upcoming_deadlines: string[];
  school_updates: string[];
  suggested_focus: string;
}

export default function BriefingView({
  studentId,
  counselorId,
}: {
  studentId: string;
  counselorId: string;
}) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/briefings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, counselorId }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setBriefing(data.briefing);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!briefing) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
        <div>
          <p className="text-sm font-medium">Pre-session briefing</p>
          <p className="text-xs text-muted-foreground">
            Generate an AI summary before your next meeting
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? "Generating..." : "Generate"}
        </Button>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="section-label">Pre-session briefing</p>
        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="text-xs"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {briefing.student_summary}
      </p>

      {briefing.overdue_items.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-600 mb-1">Overdue</p>
          {briefing.overdue_items.map((item, i) => (
            <p key={i} className="text-sm text-red-600 leading-relaxed">
              {item}
            </p>
          ))}
        </div>
      )}

      {briefing.upcoming_deadlines.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-600 mb-1">
            Upcoming deadlines
          </p>
          {briefing.upcoming_deadlines.map((item, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {item}
            </p>
          ))}
        </div>
      )}

      {briefing.since_last_session.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Since last session
          </p>
          {briefing.since_last_session.map((item, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">
              {item}
            </p>
          ))}
        </div>
      )}

      {briefing.school_updates.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            School updates
          </p>
          {briefing.school_updates.map((item, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">
              {item}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-md bg-gray-50 p-3">
        <p className="text-xs font-medium mb-1">Suggested focus</p>
        <p className="text-sm leading-relaxed">{briefing.suggested_focus}</p>
      </div>
    </div>
  );
}