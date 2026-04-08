// src/components/StudentEditForm.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  grade: number;
  gpa: number | null;
  test_scores: Record<string, any> | null;
  intended_major: string | null;
  extracurriculars: string | null;
  family_context: string | null;
}

export default function StudentEditForm({
  student,
}: {
  student: StudentData;
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState(student.first_name);
  const [lastName, setLastName] = useState(student.last_name);
  const [grade, setGrade] = useState(student.grade);
  const [gpa, setGpa] = useState(student.gpa?.toString() || "");
  const [testScores, setTestScores] = useState(
    student.test_scores ? JSON.stringify(student.test_scores) : ""
  );
  const [intendedMajor, setIntendedMajor] = useState(
    student.intended_major || ""
  );
  const [extracurriculars, setExtracurriculars] = useState(
    student.extracurriculars || ""
  );
  const [familyContext, setFamilyContext] = useState(
    student.family_context || ""
  );

  async function handleSave() {
    setLoading(true);
    setError("");

    let parsedScores = null;
    if (testScores.trim()) {
      try {
        parsedScores = JSON.parse(testScores);
      } catch {
        setError("Test scores must be valid JSON, e.g. {\"SAT\": 1450, \"ACT\": 32}");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          grade,
          gpa: gpa ? parseFloat(gpa) : null,
          test_scores: parsedScores,
          intended_major: intendedMajor || null,
          extracurriculars: extracurriculars || null,
          family_context: familyContext || null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setEditing(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setFirstName(student.first_name);
    setLastName(student.last_name);
    setGrade(student.grade);
    setGpa(student.gpa?.toString() || "");
    setTestScores(
      student.test_scores ? JSON.stringify(student.test_scores) : ""
    );
    setIntendedMajor(student.intended_major || "");
    setExtracurriculars(student.extracurriculars || "");
    setFamilyContext(student.family_context || "");
    setEditing(false);
    setError("");
  }

  if (!editing) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Student Profile</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Test Scores
              </p>
              <p className="text-sm">
                {student.test_scores
                  ? Object.entries(student.test_scores)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")
                  : "None recorded"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Intended Major
              </p>
              <p className="text-sm">
                {student.intended_major || "Undecided"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Extracurriculars
              </p>
              <p className="text-sm">
                {student.extracurriculars || "None listed"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Family Context
              </p>
              <p className="text-sm">
                {student.family_context || "None noted"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Edit Student Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                First Name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Last Name
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Grade</label>
              <Input
                type="number"
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">GPA</label>
              <Input
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                placeholder="e.g. 3.85"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Test Scores (JSON)
            </label>
            <Input
              value={testScores}
              onChange={(e) => setTestScores(e.target.value)}
              placeholder='{"SAT": 1450, "ACT": 32}'
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Intended Major
            </label>
            <Input
              value={intendedMajor}
              onChange={(e) => setIntendedMajor(e.target.value)}
              placeholder="e.g. Environmental Science"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Extracurriculars
            </label>
            <Textarea
              value={extracurriculars}
              onChange={(e) => setExtracurriculars(e.target.value)}
              rows={3}
              placeholder="List activities, clubs, sports, etc."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Family Context
            </label>
            <Textarea
              value={familyContext}
              onChange={(e) => setFamilyContext(e.target.value)}
              rows={3}
              placeholder="Financial situation, family preferences, etc."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}