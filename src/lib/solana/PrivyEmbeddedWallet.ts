import {
  PrivyClient,
  type SolanaSignTransactionRpcInputType,
} from '@privy-io/server-auth';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { WalletAdapter } from 'solana-agent-kit';

export class PrivyEmbeddedWallet implements WalletAdapter {
  private privyClient: PrivyClient;
  publicKey: PublicKey;
  secretKey: Uint8Array<ArrayBufferLike>;
  constructor(privyClient: PrivyClient, publicKey: PublicKey) {
    try {
      this.privyClient = privyClient;
      this.publicKey = publicKey;
      this.secretKey = new Uint8Array(0); // Secret key is not needed
    } catch (error) {
      throw new Error(
        `Failed to initialize wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> {
    try {
      const request: SolanaSignTransactionRpcInputType<T> = {
        address: this.publicKey.toBase58(),
        chainType: 'solana',
        method: 'signTransaction',
        params: {
          transaction,
        },
      };
      const { data } = await this.privyClient.walletApi.rpc(request);
      return data.signedTransaction as T;
    } catch (error) {
      throw new Error(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]> {
    try {
      return transactions.map((tx) => {
        if (tx instanceof Transaction) {
          tx.partialSign(this);
        }
        return tx;
      });
    } catch (error) {
      throw new Error(
        `Failed to sign transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
