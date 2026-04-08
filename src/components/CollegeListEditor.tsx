// src/components/CollegeListEditor.tsx

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CollegeListEntry {
  id: string;
  school: { name: string };
  classification: string;
  application_round: string;
  status: string;
  deadline: string | null;
  notes: string | null;
}

export default function CollegeListEditor({
  entries,
  studentId,
  counselorId,
}: {
  entries: CollegeListEntry[];
  studentId: string;
  counselorId: string;
}) {
  const [items, setItems] = useState(entries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit state
  const [editClassification, setEditClassification] = useState("");
  const [editRound, setEditRound] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Add state
  const [newSchool, setNewSchool] = useState("");
  const [newClassification, setNewClassification] = useState("TARGET");
  const [newRound, setNewRound] = useState("RD");
  const [newDeadline, setNewDeadline] = useState("");

  function startEdit(entry: CollegeListEntry) {
    setEditingId(entry.id);
    setEditClassification(entry.classification);
    setEditRound(entry.application_round);
    setEditStatus(entry.status);
    setEditDeadline(
      entry.deadline ? new Date(entry.deadline).toISOString().split("T")[0] : ""
    );
    setEditNotes(entry.notes || "");
    setError("");
  }

  async function handleUpdate(entryId: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/college-list/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classification: editClassification,
          application_round: editRound,
          status: editStatus,
          deadline: editDeadline || null,
          notes: editNotes || null,
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

  async function handleRemove(entryId: string, schoolName: string) {
    if (!confirm(`Remove ${schoolName} from the college list?`)) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/college-list/${entryId}`, {
        method: "DELETE",
      });

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
    if (!newSchool.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/college-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          counselor_id: counselorId,
          school_name: newSchool.trim(),
          classification: newClassification,
          application_round: newRound,
          deadline: newDeadline || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      setAddOpen(false);
      setNewSchool("");
      setNewClassification("TARGET");
      setNewRound("RD");
      setNewDeadline("");
      window.location.href = window.location.pathname;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const classifications = ["REACH", "TARGET", "LIKELY"];
  const rounds = ["EA", "ED", "ED2", "REA", "RD"];
  const statuses = [
    "NOT_STARTED",
    "IN_PROGRESS",
    "SUBMITTED",
    "ACCEPTED",
    "REJECTED",
    "WAITLISTED",
    "DEFERRED",
    "WITHDRAWN",
  ];

  const classificationColor: Record<string, string> = {
    REACH: "destructive",
    TARGET: "secondary",
    LIKELY: "default",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">
            {items.length} {items.length === 1 ? "school" : "schools"}
          </p>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            Add School
          </Button>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No schools added yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((cl) => {
              const isEditing = editingId === cl.id;

              if (isEditing) {
                return (
                  <div key={cl.id} className="rounded-lg border p-3 space-y-3">
                    <p className="font-medium">{cl.school.name}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Classification
                        </label>
                        <select
                          className="w-full rounded border px-2 py-1 text-sm"
                          value={editClassification}
                          onChange={(e) => setEditClassification(e.target.value)}
                        >
                          {classifications.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Round
                        </label>
                        <select
                          className="w-full rounded border px-2 py-1 text-sm"
                          value={editRound}
                          onChange={(e) => setEditRound(e.target.value)}
                        >
                          {rounds.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Status
                        </label>
                        <select
                          className="w-full rounded border px-2 py-1 text-sm"
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Deadline
                        </label>
                        <Input
                          type="date"
                          value={editDeadline}
                          onChange={(e) => setEditDeadline(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Notes
                        </label>
                        <Input
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(cl.id)}
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

              const deadline = cl.deadline ? new Date(cl.deadline) : null;

              return (
                <div
                  key={cl.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{cl.school.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={classificationColor[cl.classification] as any}
                      >
                        {cl.classification}
                      </Badge>
                      <Badge variant="outline">{cl.application_round}</Badge>
                      <Badge variant="outline">{cl.status}</Badge>
                    </div>
                    {cl.notes && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cl.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {deadline && (
                      <span className="text-xs text-muted-foreground">
                        {deadline.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(cl)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemove(cl.id, cl.school.name)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add School</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  School Name
                </label>
                <Input
                  value={newSchool}
                  onChange={(e) => setNewSchool(e.target.value)}
                  placeholder="e.g. Northwestern University"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Classification
                  </label>
                  <select
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={newClassification}
                    onChange={(e) => setNewClassification(e.target.value)}
                  >
                    {classifications.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Round
                  </label>
                  <select
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={newRound}
                    onChange={(e) => setNewRound(e.target.value)}
                  >
                    {rounds.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Deadline
                </label>
                <Input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={loading || !newSchool.trim()}
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