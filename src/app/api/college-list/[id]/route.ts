// src/app/api/college-list/[id]/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await req.json();

    const updated = await prisma.collegeList.update({
      where: { id },
      data: {
        ...(data.classification && { classification: data.classification }),
        ...(data.application_round && {
          application_round: data.application_round,
        }),
        ...(data.status && { status: data.status }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (err: any) {
    console.error("College list update error:", err);
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
    await prisma.collegeList.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("College list delete error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}