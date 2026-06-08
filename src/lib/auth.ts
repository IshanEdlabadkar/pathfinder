// src/lib/auth.ts

import { prisma } from "./prisma";
import { getSession } from "./session";
import { redirect } from "next/navigation";

export async function getCurrentCounselor() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const counselor = await prisma.counselor.findUnique({
    where: { id: session.counselorId },
  });

  if (!counselor) {
    redirect("/login");
  }

  return counselor;
}
