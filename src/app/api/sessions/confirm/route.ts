// src/app/api/sessions/confirm/route.ts

import { executeChangeset } from "@/lib/changesetExecutor";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { changeset, counselorId } = await req.json();

  if (!counselorId) {
    return NextResponse.json(
      { success: false, error: "Missing counselorId" },
      { status: 401 }
    );
  }

  try {
    const result = await executeChangeset({ changeset, counselorId });
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}