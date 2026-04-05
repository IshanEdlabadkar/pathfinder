// src/lib/changesetExecutor.ts

import { prisma } from "./prisma";
import { Changeset, ChangesetOperation } from "@/types/changeset";
import { resolveSchool } from "./schoolResolver";
import { assertStudentOwnership } from "./ownership";
import { Prisma } from "@prisma/client";

export async function executeChangeset({
  changeset,
  counselorId,
}: {
  changeset: Changeset;
  counselorId: string;
}) {
  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const results: any[] = [];

      for (const op of changeset) {
        await assertStudentOwnership(tx, op.data.student_id, counselorId);
        const res = await executeOperation(tx, op, counselorId);
        results.push(res);
      }

      return results;
    });

    await prisma.auditLog.create({
      data: {
        counselor_id: counselorId,
        student_id: extractStudentId(changeset),
        changeset: changeset as any,
        result: result as any,
        success: true,
      },
    }).catch(console.error);

    return result;
  } catch (error: any) {
    await prisma.auditLog.create({
      data: {
        counselor_id: counselorId,
        student_id: extractStudentId(changeset),
        changeset: changeset as any,
        success: false,
        error: error.message,
      },
    }).catch(console.error);

    throw error;
  }
}

function extractStudentId(changeset: Changeset): string | null {
  const ids = new Set(changeset.map((op) => op.data.student_id).filter(Boolean));
  return ids.size === 1 ? [...ids][0] : null;
}

async function executeOperation(
  tx: Prisma.TransactionClient,
  op: ChangesetOperation,
  counselorId: string
) {
  switch (op.entity) {
    case "ACTION_ITEM":
      return handleActionItem(tx, op, counselorId);
    case "COLLEGE_LIST":
      return handleCollegeList(tx, op, counselorId);
    case "SESSION":
      return handleSession(tx, op, counselorId);
    case "COUNSELOR_NOTE":
      return handleCounselorNote(tx, op, counselorId);
    default:
      throw new Error(`Unknown entity: ${op.entity}`);
  }
}

async function handleActionItem(
  tx: Prisma.TransactionClient,
  op: ChangesetOperation,
  counselorId: string
) {
  const data = op.data;

  if (op.type === "CREATE") {
    if (!data.student_id || !data.description) {
      throw new Error("Invalid action item create");
    }

    let collegeListId = null;
    if (data.school_name) {
      const school = await resolveSchool(tx, data.school_name);
      const entry = await tx.collegeList.findUnique({
        where: {
          student_id_school_id: {
            student_id: data.student_id,
            school_id: school.id,
          },
        },
      });
      collegeListId = entry?.id ?? null;
    }

    return tx.actionItem.create({
      data: {
        student_id: data.student_id,
        counselor_id: counselorId,
        description: data.description,
        due_date: data.due_date ? new Date(data.due_date) : null,
        status: "OPEN",
        college_list_id: collegeListId,
      },
    });
  }

  if (op.type === "UPDATE") {
    if (!data.action_item_id) {
      throw new Error("Missing action_item_id");
    }

    return tx.actionItem.update({
      where: { id: data.action_item_id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.due_date && { due_date: new Date(data.due_date) }),
        ...(data.description && { description: data.description }),
      },
    });
  }

  throw new Error("Unsupported ACTION_ITEM operation");
}

async function handleCollegeList(
  tx: Prisma.TransactionClient,
  op: ChangesetOperation,
  counselorId: string
) {
  const data = op.data;

  if (!data.student_id || !data.school_name) {
    throw new Error("Invalid college list operation");
  }

  const school = await resolveSchool(tx, data.school_name);

  const existing = await tx.collegeList.findUnique({
    where: {
      student_id_school_id: {
        student_id: data.student_id,
        school_id: school.id,
      },
    },
  });

  if (data.action === "ADD") {
    if (existing) return existing;

    return tx.collegeList.create({
      data: {
        student_id: data.student_id,
        school_id: school.id,
        counselor_id: counselorId,
        classification: data.classification || "TARGET",
        application_round: data.application_round || "RD",
        status: data.status || "NOT_STARTED",
        deadline: data.deadline ? new Date(data.deadline) : null,
        notes: data.notes,
      },
    });
  }

  if (data.action === "UPDATE") {
    if (!existing) {
      throw new Error("Trying to update non-existent college entry");
    }

    return tx.collegeList.update({
      where: { id: existing.id },
      data: {
        ...(data.classification && { classification: data.classification }),
        ...(data.application_round && { application_round: data.application_round }),
        ...(data.status && { status: data.status }),
        ...(data.deadline && { deadline: new Date(data.deadline) }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  if (data.action === "REMOVE") {
    if (!existing) return null;

    return tx.collegeList.delete({
      where: { id: existing.id },
    });
  }

  throw new Error("Invalid college list action");
}

async function handleSession(
  tx: Prisma.TransactionClient,
  op: ChangesetOperation,
  counselorId: string
) {
  if (op.type !== "CREATE") {
    throw new Error("Session only supports CREATE");
  }

  const data = op.data;

  return tx.session.create({
    data: {
      student_id: data.student_id,
      counselor_id: counselorId,
      date: new Date(data.date),
      raw_notes: data.raw_notes,
      parsed_summary: data.parsed_summary,
      changeset: data.changeset,
    },
  });
}

async function handleCounselorNote(
  tx: Prisma.TransactionClient,
  op: ChangesetOperation,
  counselorId: string
) {
  if (op.type !== "CREATE") {
    throw new Error("CounselorNote only supports CREATE");
  }

  const data = op.data;

  return tx.counselorNote.create({
    data: {
      student_id: data.student_id,
      counselor_id: counselorId,
      content: data.content,
    },
  });
}