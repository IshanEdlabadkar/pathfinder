// src/components/AddNoteForm.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AddNoteForm({
  studentId,
  counselorId,
}: {
  studentId: string;
  counselorId: string;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/counselor-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          counselor_id: counselorId,
          content,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setContent("");
        window.location.href = window.location.pathname;
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2 mb-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a quick note..."
        rows={2}
        className="resize-none"
      />
      <Button
        onClick={handleSubmit}
        disabled={loading || !content.trim()}
        size="sm"
        className="self-end"
      >
        {loading ? "..." : "Save"}
      </Button>
    </div>
  );
}