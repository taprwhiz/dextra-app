-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
ADD COLUMN     "lastReadAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
