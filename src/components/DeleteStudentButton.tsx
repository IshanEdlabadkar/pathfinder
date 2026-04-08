"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DeleteStudentButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Delete ${studentName}? This removes all their data permanently.`
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = "/dashboard";
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-500 hover:text-red-700"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "Deleting..." : "Delete Student"}
    </Button>
  );
}

export function ExportReportButton({ studentId }: { studentId: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => window.open(`/api/students/${studentId}/report`, "_blank")}
    >
      Export
    </Button>
  );
}