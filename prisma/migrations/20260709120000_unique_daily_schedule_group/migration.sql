-- Collapse duplicate schedule rows so each triad group keeps only its latest assigned puzzle date.
WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "triadGroupId"
            ORDER BY "puzzleDate" DESC, id DESC
        ) AS rn
    FROM "triad_daily_schedules"
)
DELETE FROM "triad_daily_schedules"
WHERE id IN (
    SELECT id
    FROM ranked
    WHERE rn > 1
);

CREATE UNIQUE INDEX "triad_daily_schedules_triadGroupId_key" ON "triad_daily_schedules"("triadGroupId");
