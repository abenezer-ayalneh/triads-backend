-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "triadGroups" ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY';
