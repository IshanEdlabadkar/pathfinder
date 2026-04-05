// src/lib/schoolResolver.ts
import { Prisma } from "@prisma/client";

export async function resolveSchool(
  tx: Prisma.TransactionClient,
  schoolName: string
) {
  const normalized = schoolName.trim().toLowerCase();

  let school = await tx.school.findFirst({
    where: {
      name: { equals: schoolName, mode: "insensitive" },
    },
  });

  if (school) return school;

  const alias = await tx.schoolAlias.findFirst({
    where: {
      alias: { equals: normalized, mode: "insensitive" },
    },
    include: { school: true },
  });

  if (alias) return alias.school;

  school = await tx.school.create({
    data: {
      name: schoolName,
      aliases: {
        create: { alias: normalized },
      },
    },
  });

  return school;
}