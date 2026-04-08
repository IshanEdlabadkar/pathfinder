-- CreateEnum
CREATE TYPE "EssayStatus" AS ENUM ('NOT_STARTED', 'DRAFTING', 'REVIEW_READY', 'REVISING', 'FINAL', 'SUBMITTED');

-- CreateTable
CREATE TABLE "Essay" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "school_id" TEXT,
    "title" TEXT NOT NULL,
    "prompt" TEXT,
    "word_limit" INTEGER,
    "status" "EssayStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "doc_link" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Essay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Essay_student_id_idx" ON "Essay"("student_id");

-- CreateIndex
CREATE INDEX "Essay_counselor_id_idx" ON "Essay"("counselor_id");

-- CreateIndex
CREATE INDEX "Essay_status_idx" ON "Essay"("status");

-- AddForeignKey
ALTER TABLE "Essay" ADD CONSTRAINT "Essay_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Essay" ADD CONSTRAINT "Essay_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "Counselor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Essay" ADD CONSTRAINT "Essay_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
