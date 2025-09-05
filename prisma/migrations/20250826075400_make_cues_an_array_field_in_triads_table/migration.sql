/*
  Warnings:

  - You are about to drop the column `cue1` on the `triads` table. All the data in the column will be lost.
  - You are about to drop the column `cue2` on the `triads` table. All the data in the column will be lost.
  - You are about to drop the column `cue3` on the `triads` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "triads" DROP COLUMN "cue1",
DROP COLUMN "cue2",
DROP COLUMN "cue3",
ADD COLUMN     "cues" TEXT[],
ADD COLUMN     "fullPhrases" TEXT[];
