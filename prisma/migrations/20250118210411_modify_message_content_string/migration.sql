-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "experimental_attachments" JSONB,
ADD COLUMN     "toolInvocations" JSONB,
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "content" SET DATA TYPE TEXT;
