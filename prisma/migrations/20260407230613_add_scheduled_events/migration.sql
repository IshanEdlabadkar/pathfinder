-- CreateTable
CREATE TABLE "ScheduledEvent" (
    "id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "student_id" TEXT,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledEvent_counselor_id_idx" ON "ScheduledEvent"("counselor_id");

-- CreateIndex
CREATE INDEX "ScheduledEvent_student_id_idx" ON "ScheduledEvent"("student_id");

-- CreateIndex
CREATE INDEX "ScheduledEvent_date_idx" ON "ScheduledEvent"("date");

-- AddForeignKey
ALTER TABLE "ScheduledEvent" ADD CONSTRAINT "ScheduledEvent_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "Counselor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledEvent" ADD CONSTRAINT "ScheduledEvent_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
