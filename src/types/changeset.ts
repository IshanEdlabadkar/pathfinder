// src/types/changeset.ts

export type ChangesetOperationType = "CREATE" | "UPDATE" | "DELETE";

export type ChangesetEntity =
  | "ACTION_ITEM"
  | "COLLEGE_LIST"
  | "SESSION"
  | "COUNSELOR_NOTE";

export interface ChangesetOperation {
  type: ChangesetOperationType;
  entity: ChangesetEntity;
  data: Record<string, any>;
}

export type Changeset = ChangesetOperation[];