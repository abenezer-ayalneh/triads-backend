-- CreateEnum
CREATE TYPE "DailyAttemptStatus" AS ENUM ('IN_PROGRESS', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "triad_daily_schedules" (
    "id" SERIAL NOT NULL,
    "puzzleDate" DATE NOT NULL,
    "triadGroupId" INTEGER NOT NULL,

    CONSTRAINT "triad_daily_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_triad_attempts" (
    "id" SERIAL NOT NULL,
    "anonymousId" TEXT NOT NULL,
    "puzzleDate" DATE NOT NULL,
    "triadGroupId" INTEGER NOT NULL,
    "status" "DailyAttemptStatus" NOT NULL,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_triad_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "triad_daily_schedules_puzzleDate_key" ON "triad_daily_schedules"("puzzleDate");

-- CreateIndex
CREATE INDEX "daily_triad_attempts_puzzleDate_idx" ON "daily_triad_attempts"("puzzleDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_triad_attempts_anonymousId_puzzleDate_key" ON "daily_triad_attempts"("anonymousId", "puzzleDate");

-- AddForeignKey
ALTER TABLE "triad_daily_schedules" ADD CONSTRAINT "triad_daily_schedules_triadGroupId_fkey" FOREIGN KEY ("triadGroupId") REFERENCES "triadGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
