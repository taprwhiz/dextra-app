'use client';

import { useEffect, useMemo, useState } from 'react';

import { SavedPrompt } from '@prisma/client';
import { motion } from 'framer-motion';
import { Loader2, Pencil, Search, Star, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/use-user';
import {
  createSavedPrompt,
  deleteSavedPrompt,
  editSavedPrompt,
  getSavedPrompts,
  setIsFavoriteSavedPrompt,
} from '@/server/actions/saved-prompt';

import { DeletePromptDialog } from './components/delete-prompt-dialog';
import { EditPromptDialog } from './components/edit-prompt-dialog';
import { FilterDropdown } from './components/filter-dropdown';
import { FilterOption, FilterValue, PromptAction } from './types/prompt';

const DEFAULT_FILTER: FilterValue = 'recentlyUsed';
const EMPTY_ACTION: PromptAction = {
  action: null,
  id: null,
};

const filterOptions: FilterOption[] = [
  {
    value: 'recentlyUsed',
    label: 'Recently Used',
  },
  {
    value: 'editedRecently',
    label: 'Edited Recently',
  },
  {
    value: 'latest',
    label: 'Newest First',
  },
  {
    value: 'oldest',
    label: 'Oldest First',
  },
  {
    value: 'favorites',
    label: 'Favorites',
  },
];

export default function SavedPromptsPage() {
  /**
   * To resuse the same dialog for both update and delete actions,
   * promptAction tracks what action is to be performed in which prompt (based on id)
   */
  const [promptAction, setPromptAction] = useState<PromptAction>(EMPTY_ACTION);

  const [filter, setFilter] = useState<FilterValue>(DEFAULT_FILTER);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);

  const { user } = useUser();

  useEffect(() => {
    async function fetchSavedPrompts() {
      try {
        const res = await getSavedPrompts();
        const savedPrompts = res?.data?.data || [];

        setSavedPrompts(savedPrompts);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
      }
    }

    fetchSavedPrompts();
  }, []);

  // Primary Filter: Filter based on options, e.g. Recently used (or) Edited recently
  const primaryFilteredPrompts = useMemo(() => {
    if (filter === 'favorites') {
      return savedPrompts.filter((prompt) => prompt.isFavorite);
    }

    const promptsToSort = [...savedPrompts];
    if (filter === 'recentlyUsed') {
      sortPrompts(promptsToSort, 'lastUsedAt');
    } else if (filter === 'editedRecently') {
      sortPrompts(promptsToSort, 'updatedAt');
    } else if (filter === 'latest') {
      sortPrompts(promptsToSort, 'createdAt');
    } else if (filter === 'oldest') {
      sortPrompts(promptsToSort, 'createdAt', true);
    }

    return promptsToSort;
  }, [filter, savedPrompts]);

  // Secondary Filter : to filter based on the search term entered by the user in search bar
  const secondaryFilteredPrompts = useMemo(() => {
    const searchTerm = search.toLowerCase();
    return searchTerm !== ''
      ? primaryFilteredPrompts.filter((prompt) => {
          return (
            prompt.title.toLowerCase().includes(searchTerm) ||
            prompt.content.toLowerCase().includes(searchTerm)
          );
        })
      : primaryFilteredPrompts;
  }, [search, primaryFilteredPrompts]);

  function sortPrompts(
    prompts: SavedPrompt[],
    property: keyof SavedPrompt,
    swapComparison = false,
  ) {
    prompts.sort((a, b) => {
      const dateA =
        a[property] && typeof a[property] !== 'boolean'
          ? new Date(a[property]).getTime()
          : 0;

      const dateB =
        b[property] && typeof b[property] !== 'boolean'
          ? new Date(b[property]).getTime()
          : 0;

      return swapComparison ? dateA - dateB : dateB - dateA;
    });
  }

  async function handleSavePrompt() {
    if (!user) {
      toast.error('Unauthorized');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Title cannot be empty');
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error('Prompt cannot be empty');
      return;
    }

    setIsLoading(true);

    toast.promise(
      createSavedPrompt({
        title: trimmedTitle,
        content: trimmedContent,
      }).then(async (res) => {
        if (!res?.data?.data) {
          throw new Error();
        }

        const savedPrompt = res.data.data;
        setSavedPrompts((old) => [...old, savedPrompt]);

        resetPromptAction();
      }),
      {
        loading: 'Saving prompt...',
        success: 'Prompt saved',
        error: 'Failed to save prompt',
      },
    );

    setIsLoading(false);
  }

  async function handleDeletePrompt() {
    if (!promptAction.id) return;

    setIsLoading(true);

    toast.promise(
      deleteSavedPrompt({ id: promptAction.id }).then(() => {
        setSavedPrompts((old) =>
          old.filter((element) => element.id !== promptAction.id),
        );

        resetPromptAction();
      }),
      {
        loading: 'Deleting prompt...',
        success: 'Prompt deleted',
        error: 'Failed to delete prompt',
      },
    );

    setIsLoading(false);
  }

  async function handleEditPrompt() {
    if (!promptAction.id) {
      toast.error('Prompt not found');
      return;
    }

    if (!title.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    if (!content.trim()) {
      toast.error('Prompt cannot be empty');
      return;
    }

    setIsLoading(true);
    toast.promise(
      editSavedPrompt({
        id: promptAction.id,
        title: title.trim(),
        content: content.trim(),
      }).then(async (res) => {
        if (!res?.data?.data) {
          throw new Error();
        }

        const { id, title, content, updatedAt } = res.data.data;
        setSavedPrompts((old) =>
          old.map((element) =>
            element.id === id
              ? { ...element, title: title, content, updatedAt }
              : element,
          ),
        );

        resetPromptAction();
      }),
      {
        loading: 'Editing prompt...',
        success: 'Prompt edited',
        error: 'Failed to edit prompt',
      },
    );

    setIsLoading(false);
  }

  async function handleAddToFavorites(id: string, isFavorite: boolean) {
    toast.promise(
      setIsFavoriteSavedPrompt({ id, isFavorite }).then((res) => {
        if (!res?.data?.data) {
          throw new Error();
        }

        const { id, isFavorite } = res.data.data;
        setSavedPrompts((old) =>
          old.map((element) =>
            element.id === id ? { ...element, isFavorite } : element,
          ),
        );

        resetPromptAction();
      }),
      {
        loading: isFavorite
          ? 'Adding to favorites...'
          : 'Removing from favorites...',
        success: isFavorite
          ? 'Prompt added to favorites'
          : 'Prompt removed from favorites',
        error: 'Failed to add to favorites',
      },
    );
  }

  function resetPromptAction() {
    setPromptAction(EMPTY_ACTION);
  }

  function updatePromptAction(action: PromptAction) {
    setPromptAction(action);
  }

  function updateFilter(value: FilterValue) {
    // Unset current filter if selected again
    if (value === filter) {
      setFilter(DEFAULT_FILTER);
    } else {
      setFilter(value);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-6 md:py-12">
      <div className="relative w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          placeholder="Search"
        />
      </div>
      <div className="flex flex-row items-center gap-4">
        <FilterDropdown
          disabled={isLoading}
          filter={filter}
          filterOptions={filterOptions}
          updateFilter={updateFilter}
        />

        <EditPromptDialog
          promptAction={promptAction}
          updatePromptAction={updatePromptAction}
          handleEditPrompt={handleEditPrompt}
          handleSavePrompt={handleSavePrompt}
          title={title}
          content={content}
          setTitle={setTitle}
          setContent={setContent}
          isLoading={isLoading}
        />
      </div>

      {savedPrompts.length === 0 ? (
        isLoading ? (
          <div className="flex w-full items-center justify-center pt-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 pt-20">
            No prompts saved yet
          </div>
        )
      ) : secondaryFilteredPrompts.length === 0 ? (
        <div className="flex items-center justify-center gap-2 pt-20">
          No match found
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {secondaryFilteredPrompts.map((prompt) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0 }}
              whileHover={{
                scale: 1.01,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.99 }}
              className="group flex flex-col gap-1.5 rounded-xl bg-muted/50 p-3 text-left transition-colors duration-200 hover:bg-primary/5 md:p-3.5"
            >
              <div className="flex w-full flex-row items-center justify-between text-base font-medium">
                <p className="text-sm font-medium md:text-base">
                  {prompt.title}
                </p>
                <div className="flex flex-row items-center">
                  <button
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                    onClick={() =>
                      handleAddToFavorites(prompt.id, !prompt.isFavorite)
                    }
                  >
                    <Star
                      fill={prompt.isFavorite ? 'hsl(var(--favorite))' : ''}
                      className={`${!prompt.isFavorite && 'hidden'} ${prompt.isFavorite && 'text-favorite'} h-4 w-4 group-hover:block`}
                    />
                  </button>
                  <button
                    onClick={() => {
                      setPromptAction({
                        action: 'update',
                        id: prompt.id,
                      });
                      setTitle(prompt.title);
                      setContent(prompt.content);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      setPromptAction({
                        action: 'delete',
                        id: prompt.id,
                      })
                    }
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground/80">
                {prompt.content.trim().slice(0, 150) + '...'}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <DeletePromptDialog
        promptAction={promptAction}
        onOpenChange={resetPromptAction}
        handleDeletePrompt={handleDeletePrompt}
      />
    </div>
  );
}
