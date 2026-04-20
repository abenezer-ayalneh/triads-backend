-- Move challenge numbering to runtime date-ordered calculation.
-- Persisted challengeNumber is no longer needed.
DROP INDEX IF EXISTS "triad_daily_schedules_challengeNumber_key";

ALTER TABLE "triad_daily_schedules"
    DROP COLUMN IF EXISTS "challengeNumber";

DROP SEQUENCE IF EXISTS "triad_daily_challenge_number_seq";
