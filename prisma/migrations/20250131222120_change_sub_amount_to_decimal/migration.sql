/*
  Warnings:

  - You are about to alter the column `amount` on the `subscription_payments` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "subscription_payments" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);
