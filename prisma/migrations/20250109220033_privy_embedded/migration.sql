-- CreateEnum
CREATE TYPE "WalletSource" AS ENUM ('CUSTOM', 'PRIVY');

-- CreateEnum
CREATE TYPE "Chain" AS ENUM ('SOLANA');

-- DropIndex
DROP INDEX "wallets_ownerId_key";

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "chain" "Chain" NOT NULL DEFAULT 'SOLANA',
ADD COLUMN     "delegated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "walletSource" "WalletSource" NOT NULL DEFAULT 'CUSTOM',
ALTER COLUMN "encryptedPrivateKey" DROP NOT NULL;
