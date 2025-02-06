'use client';

import useSWR from 'swr';

import { useUser } from '@/hooks/use-user';
import { throttle } from '@/lib/utils';
import { WalletPortfolio } from '@/types/helius/portfolio';

export function useWalletPortfolio() {
  const { user } = useUser();
  const walletAddress = user?.wallets?.[0]?.publicKey;

  const { data, mutate, isLoading } = useSWR<WalletPortfolio>(
    walletAddress ? ['wallet-portfolio', walletAddress] : null,
    async () => {
      if (!walletAddress) throw new Error('No wallet address');

      const response = await fetch(`/api/wallet/${walletAddress}/portfolio`);
      if (!response.ok) throw new Error('Failed to fetch portfolio');

      return response.json();
    },
    {
      refreshInterval: 60000, // Refresh every 60 seconds
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  );

  const refresh = throttle(() => {
    mutate();
  }, 1000);

  return { data, refresh, isLoading };
}
