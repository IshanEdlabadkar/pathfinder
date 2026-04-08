// src/components/EssayTracker.tsx

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Essay {
  id: string;
  title: string;
  prompt: string | null;
  word_limit: number | null;
  status: string;
  doc_link: string | null;
  notes: string | null;
  school: { name: string } | null;
}

export default function EssayTracker({
  essays,
  studentId,
  counselorId,
  schools,
}: {
  essays: Essay[];
  studentId: string;
  counselorId: string;
  schools: string[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editWordLimit, setEditWordLimit] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editDocLink, setEditDocLink] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newSchool, setNewSchool] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newWordLimit, setNewWordLimit] = useState("");
  const [newDocLink, setNewDocLink] = useState("");

  const statuses = [
    "NOT_STARTED",
    "DRAFTING",
    "REVIEW_READY",
    "REVISING",
    "FINAL",
    "SUBMITTED",
  ];

  const statusColors: Record<string, string> = {
    NOT_STARTED: "bg-gray-100 text-gray-700",
    DRAFTING: "bg-blue-100 text-blue-700",
    REVIEW_READY: "bg-amber-100 text-amber-700 ring-2 ring-amber-300",
    REVISING: "bg-purple-100 text-purple-700",
    FINAL: "bg-green-100 text-green-700",
    SUBMITTED: "bg-green-200 text-green-800",
  };

  const statusLabels: Record<string, string> = {
    NOT_STARTED: "Not Started",
    DRAFTING: "Drafting",
    REVIEW_READY: "Review Ready",
    REVISING: "Revising",
    FINAL: "Final",
    SUBMITTED: "Submitted",
  };

  function startEdit(essay: Essay) {
    setEditingId(essay.id);
    setEditTitle(essay.title);
    setEditPrompt(essay.prompt || "");
    setEditWordLimit(essay.word_limit?.toString() || "");
    setEditStatus(essay.status);
    setEditDocLink(essay.doc_link || "");
    setEditNotes(essay.notes || "");
    setError("");
  }

  async function handleUpdate(essayId: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/essays/${essayId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          prompt: editPrompt,
          word_limit: editWordLimit,
          status: editStatus,
          doc_link: editDocLink,
          notes: editNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      setEditingId(null);
      window.location.href = window.location.pathname;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(essayId: string) {
    if (!confirm("Delete this essay?")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/essays/${essayId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }
      window.location.href = window.location.pathname;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          title: newTitle.trim(),
          school_name: newSchool || null,
          prompt: newPrompt || null,
          word_limit: newWordLimit || null,
          doc_link: newDocLink || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      setAddOpen(false);
      setNewTitle("");
      setNewSchool("");
      setNewPrompt("");
      setNewWordLimit("");
      setNewDocLink("");
      window.location.href = window.location.pathname;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function quickStatusChange(essayId: string, newStatus: string) {
    try {
      await fetch(`/api/essays/${essayId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      window.location.href = window.location.pathname;
    } catch (err) {
      console.error(err);
    }
  }

  const reviewReady = essays.filter((e) => e.status === "REVIEW_READY");

  // Group by school
  const grouped: Record<string, Essay[]> = {};
  for (const essay of essays) {
    const schoolName = essay.school?.name || "General";
    if (!grouped[schoolName]) grouped[schoolName] = [];
    grouped[schoolName].push(essay);
  }

  const schoolNames = Object.keys(grouped).sort((a, b) => {
    const aReview = grouped[a].some((e) => e.status === "REVIEW_READY") ? 0 : 1;
    const bReview = grouped[b].some((e) => e.status === "REVIEW_READY") ? 0 : 1;
    return aReview - bReview || a.localeCompare(b);
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium">
              {essays.length} {essays.length === 1 ? "essay" : "essays"}
            </p>
            {reviewReady.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                {reviewReady.length} ready for review
              </Badge>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            Add Essay
          </Button>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {essays.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No essays tracked yet. Add a school to the college list to auto-populate essay requirements.
          </p>
        ) : (
          <div className="space-y-6">
            {schoolNames.map((schoolName) => {
              const schoolEssays = grouped[schoolName];
              const completedCount = schoolEssays.filter(
                (e) => e.status === "FINAL" || e.status === "SUBMITTED"
              ).length;
              const reviewCount = schoolEssays.filter(
                (e) => e.status === "REVIEW_READY"
              ).length;

              return (
                <div key={schoolName}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{schoolName}</p>
                      <span className="text-xs text-muted-foreground">
                        {completedCount}/{schoolEssays.length} complete
                      </span>
                    </div>
                    {reviewCount > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                        {reviewCount} to review
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 ml-1 border-l-2 border-gray-100 pl-3">
                    {schoolEssays.map((essay) => {
                      const isEditing = editingId === essay.id;

                      if (isEditing) {
                        return (
                          <div
                            key={essay.id}
                            className="rounded-lg border p-3 space-y-3"
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-muted-foreground">
                                  Title
                                </label>
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">
                                  Status
                                </label>
                                <select
                                  className="w-full rounded border px-2 py-1.5 text-sm"
                                  value={editStatus}
                                  onChange={(e) =>
                                    setEditStatus(e.target.value)
                                  }
                                >
                                  {statuses.map((s) => (
                                    <option key={s} value={s}>
                                      {statusLabels[s]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">
                                Prompt
                              </label>
                              <Textarea
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                rows={2}
                                className="resize-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-muted-foreground">
                                  Word Limit
                                </label>
                                <Input
                                  type="number"
                                  value={editWordLimit}
                                  onChange={(e) =>
                                    setEditWordLimit(e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">
                                  Google Doc Link
                                </label>
                                <Input
                                  value={editDocLink}
                                  onChange={(e) =>
                                    setEditDocLink(e.target.value)
                                  }
                                  placeholder="https://docs.google.com/..."
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">
                                Notes
                              </label>
                              <Input
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdate(essay.id)}
                                disabled={loading}
                              >
                                {loading ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={essay.id}
                          className={`rounded-lg border p-3 ${
                            essay.status === "REVIEW_READY"
                              ? "border-amber-200 bg-amber-50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {essay.title}
                              </p>
                              {essay.word_limit && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {essay.word_limit}w
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <select
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium border-0 cursor-pointer ${
                                  statusColors[essay.status]
                                }`}
                                value={essay.status}
                                onChange={(e) =>
                                  quickStatusChange(essay.id, e.target.value)
                                }
                              >
                                {statuses.map((s) => (
                                  <option key={s} value={s}>
                                    {statusLabels[s]}
                                  </option>
                                ))}
                              </select>
                              {essay.doc_link ? (
                                  <a
                                  href={essay.doc_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Open Doc
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No doc
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(essay)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDelete(essay.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          {essay.prompt && (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {essay.prompt}
                            </p>
                          )}
                          {essay.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {essay.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Essay</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Why Northwestern, Common App Personal Statement"
                />
              </div>
              {schools.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    School (optional)
                  </label>
                  <select
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={newSchool}
                    onChange={(e) => setNewSchool(e.target.value)}
                  >
                    <option value="">General — no school</option>
                    {schools.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Prompt (optional)
                </label>
                <Textarea
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  rows={2}
                  className="resize-none"
                  placeholder="The essay question or prompt"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Word Limit
                  </label>
                  <Input
                    type="number"
                    value={newWordLimit}
                    onChange={(e) => setNewWordLimit(e.target.value)}
                    placeholder="e.g. 650"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Google Doc Link
                  </label>
                  <Input
                    value={newDocLink}
                    onChange={(e) => setNewDocLink(e.target.value)}
                    placeholder="https://docs.google.com/..."
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={loading || !newTitle.trim()}
                >
                  {loading ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}