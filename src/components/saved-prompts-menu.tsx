import { SavedPrompt } from '@prisma/client';
import { Loader2 } from 'lucide-react';

interface SavedPromptsMenuProps {
  input: string;
  isFetchingSavedPrompts: boolean;
  savedPrompts: SavedPrompt[];
  filteredPrompts: SavedPrompt[];
  onPromptClick: (subtitle: string) => void;
  updatePromptLastUsedAt: (id: string) => Promise<void>;
  onHomeScreen?: boolean;
}

export const SavedPromptsMenu = ({
  input,
  isFetchingSavedPrompts,
  savedPrompts,
  filteredPrompts,
  onPromptClick,
  updatePromptLastUsedAt,
  onHomeScreen = false,
}: SavedPromptsMenuProps) => (
  <div
    style={{ display: input.startsWith('/') ? 'flex' : 'none' }}
    className={`${onHomeScreen == false ? 'absolute bottom-[150px] left-0' : ''} z-[100] max-h-[300px] min-h-[70px] w-full flex-col gap-2 overflow-x-hidden overflow-y-scroll rounded-2xl bg-[#f5f5f5] p-4 dark:bg-[#222222]`}
  >
    <p className="font-semibold">Saved Prompts</p>
    {isFetchingSavedPrompts ? (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ) : savedPrompts.length === 0 ? (
      <div className="flex h-full w-full items-center justify-center gap-2">
        No prompts saved yet
      </div>
    ) : filteredPrompts.length === 0 ? (
      <div className=" flex h-full w-full items-center justify-center gap-2">
        No match found
      </div>
    ) : (
      filteredPrompts.map((filteredPrompt) => (
        <div
          onClick={() => {
            onPromptClick(filteredPrompt.content);
            updatePromptLastUsedAt(filteredPrompt.id);
          }}
          key={filteredPrompt.id}
          className="flex cursor-pointer flex-col gap-1.5 rounded-[0.5rem] bg-primary/10 p-2 text-left 
                transition-colors duration-200 hover:bg-primary/5"
        >
          <p className="truncate">{filteredPrompt.title}</p>
          <div className="truncate text-xs text-muted-foreground/80">
            {filteredPrompt.content}
          </div>
        </div>
      ))
    )}
  </div>
);
