// src/app/api/action-items/[id]/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await req.json();

    const updated = await prisma.actionItem.update({
      where: { id },
      data: {
        ...(data.description && { description: data.description }),
        ...(data.due_date !== undefined && {
          due_date: data.due_date ? new Date(data.due_date) : null,
        }),
        ...(data.status && { status: data.status }),
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    console.error("Action item update error:", err);
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
    await prisma.actionItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Action item delete error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}