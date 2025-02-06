'use server';

import { SavedPrompt } from '@prisma/client';
import { z } from 'zod';

import { ActionResponse, actionClient } from '@/lib/safe-action';

import {
  dbCreateSavedPrompt,
  dbDeleteSavedPrompt,
  dbGetSavedPrompts,
  dbUpdateSavedPrompt,
  dbUpdateSavedPromptIsFavorite,
  dbUpdateSavedPromptLastUsedAt,
} from '../db/queries';
import { verifyUser } from './user';

export const createSavedPrompt = actionClient
  .schema(z.object({ title: z.string(), content: z.string() }))
  .action<
    ActionResponse<SavedPrompt>
  >(async ({ parsedInput: { title, content } }) => {
    const authResult = await verifyUser();
    const userId = authResult?.data?.data?.id;

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const savedPrompt = await dbCreateSavedPrompt({ userId, title, content });
    if (!savedPrompt) {
      return {
        success: false,
        error: 'Failed to create saved prompt',
      };
    }

    return { success: true, data: savedPrompt };
  });

export const deleteSavedPrompt = actionClient
  .schema(z.object({ id: z.string() }))
  .action<ActionResponse<boolean>>(async ({ parsedInput: { id } }) => {
    const authResult = await verifyUser();
    const userId = authResult?.data?.data?.id;

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const isDeleted = await dbDeleteSavedPrompt({ id });
    if (!isDeleted) {
      return {
        success: false,
        error: 'Failed to delete saved prompt',
      };
    }

    return { success: true, data: isDeleted };
  });

export const editSavedPrompt = actionClient
  .schema(z.object({ id: z.string(), title: z.string(), content: z.string() }))
  .action<
    ActionResponse<SavedPrompt>
  >(async ({ parsedInput: { id, title, content } }) => {
    const authResult = await verifyUser();
    const userId = authResult?.data?.data?.id;

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const updatedPrompt = await dbUpdateSavedPrompt({ id, title, content });
    if (!updatedPrompt) {
      return { success: false, error: 'Failed to update saved prompt' };
    }

    return { success: true, data: updatedPrompt };
  });

export const getSavedPrompts = actionClient.action<
  ActionResponse<SavedPrompt[]>
>(async () => {
  const authResult = await verifyUser();
  const userId = authResult?.data?.data?.id;

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const savedPrompts = await dbGetSavedPrompts({ userId });
  if (!savedPrompts) {
    return {
      success: false,
      error: 'Failed to get saved prompts',
    };
  }

  return { success: true, data: savedPrompts };
});

export const setIsFavoriteSavedPrompt = actionClient
  .schema(z.object({ id: z.string(), isFavorite: z.boolean() }))
  .action<
    ActionResponse<SavedPrompt>
  >(async ({ parsedInput: { id, isFavorite } }) => {
    const authResult = await verifyUser();
    const userId = authResult?.data?.data?.id;

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const updatedPrompt = await dbUpdateSavedPromptIsFavorite({
      id,
      isFavorite,
    });

    if (!updatedPrompt) {
      return {
        success: false,
        error: 'Failed to update favorite saved prompt',
      };
    }

    return { success: true, data: updatedPrompt };
  });

export const setSavedPromptLastUsedAt = actionClient
  .schema(z.object({ id: z.string() }))
  .action<ActionResponse<SavedPrompt>>(async ({ parsedInput: { id } }) => {
    const authResult = await verifyUser();
    const userId = authResult?.data?.data?.id;

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const updatedPrompt = await dbUpdateSavedPromptLastUsedAt({ id });
    if (!updatedPrompt) {
      return {
        success: false,
        error: 'Failed to update saved prompt lastUsedAt',
      };
    }

    return { success: true, data: updatedPrompt };
  });
