// src/components/StudentSearch.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function StudentSearch({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [query, setQuery] = useState("");

  function handleChange(value: string) {
    setQuery(value);
    onSearch(value);
  }

  return (
    <Input
      placeholder="Search students..."
      value={query}
      onChange={(e) => handleChange(e.target.value)}
      className="max-w-xs"
    />
  );
}