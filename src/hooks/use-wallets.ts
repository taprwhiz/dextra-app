'use client';

import useSWR from 'swr';

import { syncEmbeddedWallets } from '@/server/actions/user';

export function useEmbeddedWallets() {
  return useSWR('embeddedWallets', async () => {
    // Call the action once, get back both user + wallets
    const result = await syncEmbeddedWallets();
    if (!result?.data?.success) {
      throw new Error(result?.data?.error ?? 'Failed to sync wallets');
    }
    // Return just the wallets array for convenience
    return result?.data?.data?.wallets;
  });
}
