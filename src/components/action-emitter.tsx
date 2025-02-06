'use client';

import { useEffect } from 'react';

import { EVENTS } from '@/lib/events';

interface ActionEmitterProps {
  actionId: string;
}

export function ActionEmitter({ actionId }: ActionEmitterProps) {
  useEffect(() => {
    if (actionId) {
      console.log(
        '[ActionEmitter] Emitting action created event for:',
        actionId,
      );
      window.dispatchEvent(new CustomEvent(EVENTS.ACTION_CREATED));
    }
  }, [actionId]);

  return null;
}
