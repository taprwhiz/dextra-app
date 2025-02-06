-- AlterTable
ALTER TABLE "actions" ADD COLUMN     "startTime" TIMESTAMP(3);
ALTER TABLE "actions" ADD COLUMN     "name"      VARCHAR(255);
UPDATE "actions" SET name = description;
