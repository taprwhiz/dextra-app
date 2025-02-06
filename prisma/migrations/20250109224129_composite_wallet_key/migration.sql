/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,publicKey]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "wallets_ownerId_publicKey_key" ON "wallets"("ownerId", "publicKey");
