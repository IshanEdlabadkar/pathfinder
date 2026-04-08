// src/components/ActionItemEditor.tsx

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

interface ActionItem {
  id: string;
  description: string;
  due_date: string | null;
  status: string;
  college_list?: { school: { name: string } } | null;
}

export default function ActionItemEditor({
  items,
  studentId,
  counselorId,
}: {
  items: ActionItem[];
  studentId: string;
  counselorId: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [nudgeStudentName, setNudgeStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Edit state
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Add state
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const statuses = ["OPEN", "IN_PROGRESS", "COMPLETE"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function startEdit(item: ActionItem) {
    setEditingId(item.id);
    setEditDescription(item.description);
    setEditDueDate(
      item.due_date
        ? new Date(item.due_date).toISOString().split("T")[0]
        : ""
    );
    setEditStatus(item.status);
    setError("");
  }

  async function handleUpdate(itemId: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/action-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editDescription,
          due_date: editDueDate || null,
          status: editStatus,
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

  async function handleDelete(itemId: string) {
    if (!confirm("Delete this action item?")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/action-items/${itemId}`, {
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
    if (!newDescription.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/action-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          counselor_id: counselorId,
          description: newDescription.trim(),
          due_date: newDueDate || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      setAddOpen(false);
      setNewDescription("");
      setNewDueDate("");
      window.location.href = window.location.pathname;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleNudge(itemId: string) {
    setNudgeLoading(true);
    setCopied(false);
    setError("");

    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionItemId: itemId, counselorId }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      setNudgeMessage(data.message);
      setNudgeStudentName(data.studentName);
      setNudgeOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setNudgeLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(nudgeMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getStatusColor(status: string, isOverdue: boolean) {
    if (isOverdue) return "destructive";
    if (status === "COMPLETE") return "outline";
    if (status === "IN_PROGRESS") return "default";
    return "secondary";
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddOpen(true)}
            >
              Add Item
            </Button>
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No action items.</p>
          ) : (
            <div className="space-y-3">
              {items.map((ai) => {
                const dueDate = ai.due_date ? new Date(ai.due_date) : null;
                const isOverdue =
                  ai.status !== "COMPLETE" &&
                  dueDate !== null &&
                  dueDate < today;
                const isEditing = editingId === ai.id;

                if (isEditing) {
                  return (
                    <div
                      key={ai.id}
                      className="rounded-lg border p-3 space-y-3"
                    >
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Description
                        </label>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Due Date
                          </label>
                          <Input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Status
                          </label>
                          <select
                            className="w-full rounded border px-2 py-1.5 text-sm"
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(ai.id)}
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
                    key={ai.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      isOverdue ? "border-red-200 bg-red-50" : ""
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm ${
                          ai.status === "COMPLETE"
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {ai.description}
                      </p>
                      {ai.college_list?.school && (
                        <p className="text-xs text-muted-foreground">
                          {ai.college_list.school.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getStatusColor(ai.status, isOverdue) as any}
                      >
                        {isOverdue ? "OVERDUE" : ai.status}
                      </Badge>
                      {dueDate && (
                        <span className="text-xs text-muted-foreground">
                          {dueDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      {isOverdue && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleNudge(ai.id)}
                          disabled={nudgeLoading}
                        >
                          {nudgeLoading ? "..." : "Nudge"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(ai)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(ai.id)}
                      >
                        Delete
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
                <DialogTitle>Add Action Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Description
                  </label>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. Draft Northwestern supplement essay"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    disabled={loading || !newDescription.trim()}
                  >
                    {loading ? "Adding..." : "Add"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Dialog open={nudgeOpen} onOpenChange={setNudgeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reminder for {nudgeStudentName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {nudgeMessage}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNudgeOpen(false)}
              >
                Close
              </Button>
              <Button onClick={handleCopy}>
                {copied ? "Copied!" : "Copy to clipboard"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}