// src/components/NotesForm.tsx

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Changeset } from "@/types/changeset";

export default function NotesForm({
  studentId,
  counselorId,
}: {
  studentId: string;
  counselorId: string;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [changeset, setChangeset] = useState<Changeset | null>(null);
  const [parsedSummary, setParsedSummary] = useState("");
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser. Use Chrome or Edge, or use Wispr Flow.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = notes;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
          setNotes(finalTranscript);
        } else {
          interim = transcript;
        }
      }
      // Show interim results appended to current text
      if (interim) {
        setNotes(finalTranscript + (finalTranscript ? " " : "") + interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access in your browser settings.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setError("");
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }

  async function handleParse() {
    if (!notes.trim()) return;
    if (isListening) stopListening();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sessions/parse-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, counselorId, rawNotes: notes }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setChangeset(data.changeset);
      setParsedSummary(data.parsedSummary);
      setConfirming(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!changeset) return;
    setLoading(true);
    setError("");

    const fullChangeset: Changeset = [
      ...changeset,
      {
        type: "CREATE",
        entity: "SESSION",
        data: {
          student_id: studentId,
          raw_notes: notes,
          parsed_summary: parsedSummary,
          changeset: [...changeset],
        },
      },
    ];

    try {
      const res = await fetch("/api/sessions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeset: fullChangeset, counselorId }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setNotes("");
      setChangeset(null);
      setParsedSummary("");
      setConfirming(false);
      window.location.href = window.location.pathname;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setChangeset(null);
    setParsedSummary("");
    setConfirming(false);
  }

  function removeOperation(index: number) {
    if (!changeset) return;
    setChangeset(changeset.filter((_, i) => i !== index));
  }

  const entityLabels: Record<string, string> = {
    ACTION_ITEM: "Task",
    COLLEGE_LIST: "School",
    SESSION: "Session",
    COUNSELOR_NOTE: "Note",
    SCHEDULED_EVENT: "Event",
    ESSAY: "Essay",
  };

  function describeOperation(op: any): string {
    if (op.entity === "COLLEGE_LIST") {
      const action = op.data.action?.toLowerCase() || op.type.toLowerCase();
      return `${action} ${op.data.school_name}${
        op.data.classification ? ` as ${op.data.classification}` : ""
      }${op.data.application_round ? ` (${op.data.application_round})` : ""}`;
    }
    if (op.entity === "ACTION_ITEM" && op.type === "CREATE") {
      return `${op.data.description}${
        op.data.due_date
          ? ` \u2014 due ${new Date(op.data.due_date).toLocaleDateString()}`
          : ""
      }`;
    }
    if (op.entity === "ACTION_ITEM" && op.type === "UPDATE") {
      const parts = [];
      if (op.data.status) parts.push(op.data.status);
      if (op.data.due_date)
        parts.push(`due ${new Date(op.data.due_date).toLocaleDateString()}`);
      return parts.join(", ") || "update";
    }
    if (op.entity === "COUNSELOR_NOTE") {
      const text = op.data.content || "";
      return text.length > 60 ? text.slice(0, 60) + "..." : text;
    }
    if (op.entity === "SCHEDULED_EVENT") {
      return `${op.data.title}${
        op.data.date
          ? ` \u2014 ${new Date(op.data.date).toLocaleDateString()}`
          : ""
      }`;
    }
    if (op.entity === "ESSAY" && op.type === "CREATE") {
      return `Add essay: ${op.data.title}${
        op.data.school_name ? ` (${op.data.school_name})` : ""
      }${op.data.doc_link ? " with doc link" : ""}`;
    }
    if (op.entity === "ESSAY" && op.type === "UPDATE") {
      const parts = [];
      if (op.data.status) parts.push(op.data.status);
      if (op.data.doc_link) parts.push("doc link added");
      if (op.data.notes) parts.push(op.data.notes.slice(0, 40));
      return `Update essay: ${parts.join(", ") || "update"}`;
    }
    return `${op.type} ${op.entity}`;
  }

  return (
    <div className="rounded-lg border p-4">
      {!confirming ? (
        <div className="space-y-3">
          <div className="relative">
            <Textarea
              placeholder={
                isListening
                  ? "Listening... speak your session notes"
                  : "Enter session notes or click the mic to dictate..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className={`resize-none ${isListening ? "border-red-300 bg-red-50" : ""}`}
            />
            {isListening && (
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? "Stop Recording" : "Dictate"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {isListening
                  ? "Recording... click Stop when done"
                  : "Type or dictate your session notes"}
              </p>
            </div>
            <Button
              onClick={handleParse}
              disabled={loading || !notes.trim()}
              size="sm"
            >
              {loading ? "Parsing..." : "Parse notes"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {parsedSummary && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Summary
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {parsedSummary}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Proposed changes ({changeset?.length || 0})
            </p>
            <div className="space-y-1.5">
              {changeset?.map((op, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {entityLabels[op.entity] || op.entity}
                    </Badge>
                    <span className="text-sm">{describeOperation(op)}</span>
                  </div>
                  <button
                    onClick={() => removeOperation(i)}
                    className="text-xs text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleConfirm} disabled={loading} size="sm">
              {loading ? "Saving..." : "Confirm"}
            </Button>
            <Button variant="ghost" onClick={handleCancel} size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}