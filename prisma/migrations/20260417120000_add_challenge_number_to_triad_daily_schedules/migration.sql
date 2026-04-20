-- Monotonic counter backing TriadDailySchedule.challengeNumber.
CREATE SEQUENCE "triad_daily_challenge_number_seq";

ALTER TABLE "triad_daily_schedules"
    ADD COLUMN "challengeNumber" INTEGER;

-- Backfill existing rows in chronological order so the earliest scheduled puzzle becomes #1.
WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY "puzzleDate" ASC, id ASC) AS rn
    FROM "triad_daily_schedules"
)
UPDATE "triad_daily_schedules" t
SET "challengeNumber" = o.rn
FROM ordered o
WHERE t.id = o.id;

-- Seed the sequence to the current max so the next creation continues from there.
-- Empty table case: set to 1 with is_called=false so first nextval() returns 1.
WITH seed AS (
    SELECT MAX("challengeNumber") AS max_challenge_number
    FROM "triad_daily_schedules"
)
SELECT setval(
    'triad_daily_challenge_number_seq',
    COALESCE((SELECT max_challenge_number FROM seed), 1),
    (SELECT max_challenge_number IS NOT NULL FROM seed)
);

ALTER TABLE "triad_daily_schedules"
    ALTER COLUMN "challengeNumber" SET NOT NULL;

CREATE UNIQUE INDEX "triad_daily_schedules_challengeNumber_key" ON "triad_daily_schedules"("challengeNumber");
