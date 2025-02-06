'use server';

import { SavedPrompt } from '@prisma/client';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { ActionResponse, actionClient } from '@/lib/safe-action';

import { verifyUser } from './user';

export const markConversationAsRead = actionClient
  .schema(z.object({ id: z.string() }))
  .action<ActionResponse<SavedPrompt>>(async ({ parsedInput: { id } }) => {
    const authResult = await verifyUser();
    const userId = authResult?.data?.data?.id;

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update conversation last read timestamp
    await prisma.conversation.update({
      where: { id },
      data: { lastReadAt: new Date() },
    });

    return { success: true };
  });
