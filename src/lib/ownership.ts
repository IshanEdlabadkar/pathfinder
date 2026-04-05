// src/lib/ownership.ts
import { Prisma } from "@prisma/client";

export async function assertStudentOwnership(
  tx: Prisma.TransactionClient,
  studentId: string,
  counselorId: string
) {
  const student = await tx.student.findUnique({
    where: { id: studentId },
  });

  if (!student || student.counselor_id !== counselorId) {
    throw new Error("Unauthorized: invalid student access");
  }

  return student;
}