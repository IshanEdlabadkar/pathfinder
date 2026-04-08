// src/app/api/essays/[id]/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await req.json();

    const updated = await prisma.essay.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.prompt !== undefined && { prompt: data.prompt || null }),
        ...(data.word_limit !== undefined && {
          word_limit: data.word_limit ? parseInt(data.word_limit) : null,
        }),
        ...(data.status && { status: data.status }),
        ...(data.doc_link !== undefined && { doc_link: data.doc_link || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });

    return NextResponse.json({ success: true, essay: updated });
  } catch (err: any) {
    console.error("Update essay error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.essay.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete essay error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}