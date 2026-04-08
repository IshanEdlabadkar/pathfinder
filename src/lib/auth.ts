// src/lib/auth.ts

import { prisma } from "./prisma";

// For now, returns the first counselor in the database
// Replace with real auth later
export async function getCurrentCounselor() {
  const counselor = await prisma.counselor.findFirst();

  if (!counselor) {
    throw new Error("No counselor found — run the seed script");
  }

  return counselor;
}