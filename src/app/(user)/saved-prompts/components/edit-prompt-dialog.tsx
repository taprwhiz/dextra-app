import { Dispatch, SetStateAction } from 'react';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { MAX_CHARS } from '../../home/conversation-input';
import { PromptAction } from '../types/prompt';

interface EditPromptDialogProps {
  promptAction: PromptAction;
  updatePromptAction: (action: PromptAction) => void;
  handleEditPrompt: () => Promise<void>;
  handleSavePrompt: () => Promise<void>;
  title: string;
  content: string;
  setTitle: Dispatch<SetStateAction<string>>;
  setContent: Dispatch<SetStateAction<string>>;
  isLoading: boolean;
}

export const EditPromptDialog = ({
  promptAction,
  updatePromptAction,
  handleEditPrompt,
  handleSavePrompt,
  title,
  content,
  setTitle,
  setContent,
  isLoading,
}: EditPromptDialogProps) => (
  <Dialog
    onOpenChange={() => {
      if (promptAction.action !== null) {
        updatePromptAction({ action: null, id: null });
      } else {
        setTitle('');
        setContent('');
      }
    }}
    open={promptAction.action === 'save' || promptAction.action === 'update'}
  >
    <DialogTrigger asChild>
      <Button
        onClick={() => updatePromptAction({ action: 'save', id: null })}
        variant="secondary"
        disabled={isLoading}
      >
        Add Prompt <Plus className="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[650px]">
      <DialogHeader>
        <DialogTitle>
          {promptAction.action === 'update' ? 'Edit' : 'Add'} Prompt
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-4">
        <Input
          autoComplete="off"
          type="text"
          value={title}
          placeholder="Title"
          onChange={(e) => setTitle(e.target.value)}
          className="col-span-3"
        />
        <Textarea
          autoComplete="off"
          value={content}
          rows={4}
          placeholder="Prompt"
          maxLength={MAX_CHARS}
          onChange={(e) => setContent(e.target.value)}
          className={`col-span-3 resize-none 
            ${content.length > 500 ? 'min-h-[300px] md:min-h-[400px]' : 'min-h-[100px] md:min-h-[200px]'}
          `}
        />
        <div className="text-sm text-gray-500">
          {content.length}/{MAX_CHARS} chars
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={isLoading}
          onClick={
            promptAction.action === 'update'
              ? handleEditPrompt
              : handleSavePrompt
          }
          type="submit"
        >
          Save {promptAction.action === 'update' ? 'Changes' : 'Prompt'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
