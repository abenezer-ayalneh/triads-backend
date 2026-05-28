-- CreateTable
CREATE TABLE "daily_classic_extra_usage" (
    "id" SERIAL NOT NULL,
    "anonymousId" TEXT NOT NULL,
    "puzzleDate" DATE NOT NULL,
    "gamesStarted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_classic_extra_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_classic_extra_usage_anonymousId_puzzleDate_key" ON "daily_classic_extra_usage"("anonymousId", "puzzleDate");
