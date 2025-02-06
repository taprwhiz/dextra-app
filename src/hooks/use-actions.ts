'use client';

import { Action } from '@prisma/client';
import useSWR from 'swr';

export function useActions(userId?: string) {
  const {
    data: actions,
    isLoading,
    error,
    mutate,
  } = useSWR<Action[]>(
    userId ? '/api/actions' : null,
    async (url) => {
      const res = await fetch(url);
      const data = await res.json();

      return data;
    },
    {
      revalidateOnFocus: false,
    },
  );

  if (error) {
    console.error('Hook: Error fetching actions:', error);
  }

  return {
    actions,
    isLoading,
    error,
    mutate,
  };
}
