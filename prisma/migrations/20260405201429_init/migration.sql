-- CreateEnum
CREATE TYPE "Classification" AS ENUM ('REACH', 'TARGET', 'LIKELY');

-- CreateEnum
CREATE TYPE "ApplicationRound" AS ENUM ('EA', 'ED', 'ED2', 'REA', 'RD');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'WAITLISTED', 'DEFERRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETE', 'OVERDUE');

-- CreateTable
CREATE TABLE "Counselor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Counselor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "gpa" DOUBLE PRECISION,
    "test_scores" JSONB,
    "intended_major" TEXT,
    "extracurriculars" TEXT,
    "family_context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scorecard_id" TEXT,
    "research_cache" JSONB,
    "research_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolAlias" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "SchoolAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeList" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "classification" "Classification" NOT NULL DEFAULT 'TARGET',
    "application_round" "ApplicationRound" NOT NULL DEFAULT 'RD',
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "deadline" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollegeList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "raw_notes" TEXT NOT NULL,
    "parsed_summary" TEXT,
    "changeset" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "college_list_id" TEXT,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "ActionItemStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounselorNote" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounselorNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "student_id" TEXT,
    "changeset" JSONB NOT NULL,
    "result" JSONB,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Counselor_email_key" ON "Counselor"("email");

-- CreateIndex
CREATE INDEX "Student_counselor_id_idx" ON "Student"("counselor_id");

-- CreateIndex
CREATE UNIQUE INDEX "School_name_key" ON "School"("name");

-- CreateIndex
CREATE INDEX "SchoolAlias_school_id_idx" ON "SchoolAlias"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolAlias_alias_key" ON "SchoolAlias"("alias");

-- CreateIndex
CREATE INDEX "CollegeList_student_id_idx" ON "CollegeList"("student_id");

-- CreateIndex
CREATE INDEX "CollegeList_counselor_id_idx" ON "CollegeList"("counselor_id");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeList_student_id_school_id_key" ON "CollegeList"("student_id", "school_id");

-- CreateIndex
CREATE INDEX "Session_student_id_idx" ON "Session"("student_id");

-- CreateIndex
CREATE INDEX "Session_counselor_id_idx" ON "Session"("counselor_id");

-- CreateIndex
CREATE INDEX "Session_date_idx" ON "Session"("date");

-- CreateIndex
CREATE INDEX "ActionItem_student_id_idx" ON "ActionItem"("student_id");

-- CreateIndex
CREATE INDEX "ActionItem_counselor_id_idx" ON "ActionItem"("counselor_id");

-- CreateIndex
CREATE INDEX "ActionItem_status_idx" ON "ActionItem"("status");

-- CreateIndex
CREATE INDEX "ActionItem_due_date_idx" ON "ActionItem"("due_date");

-- CreateIndex
CREATE INDEX "CounselorNote_student_id_idx" ON "CounselorNote"("student_id");

-- CreateIndex
CREATE INDEX "CounselorNote_counselor_id_idx" ON "CounselorNote"("counselor_id");

-- CreateIndex
CREATE INDEX "AuditLog_counselor_id_idx" ON "AuditLog"("counselor_id");

-- CreateIndex
CREATE INDEX "AuditLog_student_id_idx" ON "AuditLog"("student_id");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "Counselor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolAlias" ADD CONSTRAINT "SchoolAlias_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeList" ADD CONSTRAINT "CollegeList_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeList" ADD CONSTRAINT "CollegeList_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeList" ADD CONSTRAINT "CollegeList_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "Counselor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "Counselor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "Counselor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_college_list_id_fkey" FOREIGN KEY ("college_list_id") REFERENCES "CollegeList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounselorNote" ADD CONSTRAINT "CounselorNote_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounselorNote" ADD CONSTRAINT "CounselorNote_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "Counselor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "Counselor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
