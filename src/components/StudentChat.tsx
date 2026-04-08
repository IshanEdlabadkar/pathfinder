// src/components/StudentChat.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "counselor" | "assistant";
  content: string;
}

function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(
          <span key={key++}>{remaining.slice(0, boldMatch.index)}</span>
        );
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // No more matches — push the rest
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts;
}

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <br key={i} />;

    // Bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return (
        <p key={i} className="ml-4">
          &bull; {renderMarkdown(line.trim().slice(2))}
        </p>
      );
    }

    // Numbered lists
    const numberedMatch = line.trim().match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      return (
        <p key={i} className="ml-4">
          {numberedMatch[1]}. {renderMarkdown(numberedMatch[2])}
        </p>
      );
    }

    return <p key={i}>{renderMarkdown(line)}</p>;
  });
}

export default function StudentChat({
  studentId,
  counselorId,
  studentName,
}: {
  studentId: string;
  counselorId: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "counselor", content: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, counselorId, question }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full"
      >
        Ask about {studentName}
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Ask about {studentName}</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 max-h-96 space-y-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ask anything about this student — session history, why a school
              was added or dropped, deadline status, profile strength, etc.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-sm ${
                msg.role === "counselor"
                  ? "bg-blue-50 ml-8"
                  : "bg-gray-50 mr-8"
              }`}
            >
              <div className="whitespace-pre-wrap">
                {msg.role === "assistant"
                  ? renderContent(msg.content)
                  : msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="mr-8 rounded-lg bg-gray-50 p-3 text-sm text-muted-foreground">
              Thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Are her extracurriculars strong enough for Northwestern?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}