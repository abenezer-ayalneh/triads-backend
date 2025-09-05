-- CreateTable
CREATE TABLE "triads" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "cue1" TEXT NOT NULL,
    "cue2" TEXT NOT NULL,
    "cue3" TEXT NOT NULL,

    CONSTRAINT "triads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triadGroups" (
    "id" SERIAL NOT NULL,
    "triad1Id" INTEGER NOT NULL,
    "triad2Id" INTEGER NOT NULL,
    "triad3Id" INTEGER NOT NULL,
    "triad4Id" INTEGER NOT NULL,

    CONSTRAINT "triadGroups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "triadGroups" ADD CONSTRAINT "triadGroups_triad1Id_fkey" FOREIGN KEY ("triad1Id") REFERENCES "triads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triadGroups" ADD CONSTRAINT "triadGroups_triad2Id_fkey" FOREIGN KEY ("triad2Id") REFERENCES "triads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triadGroups" ADD CONSTRAINT "triadGroups_triad3Id_fkey" FOREIGN KEY ("triad3Id") REFERENCES "triads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triadGroups" ADD CONSTRAINT "triadGroups_triad4Id_fkey" FOREIGN KEY ("triad4Id") REFERENCES "triads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
