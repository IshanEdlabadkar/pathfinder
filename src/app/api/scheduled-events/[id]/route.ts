// src/app/api/scheduled-events/[id]/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  console.log("Delete event:", id, "type:", type);

  try {
    switch (type) {
      case "task":
        await prisma.actionItem.delete({ where: { id } });
        break;
      case "deadline":
        await prisma.collegeList.delete({ where: { id } });
        break;
      case "session":
        await prisma.session.delete({ where: { id } });
        break;
      case "scheduled":
        await prisma.scheduledEvent.delete({ where: { id } });
        break;
      default:
        await prisma.scheduledEvent.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete event error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}