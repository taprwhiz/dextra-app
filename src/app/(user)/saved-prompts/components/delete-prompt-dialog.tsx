import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { PromptAction } from '../types/prompt';

interface DeletePromptDialogProps {
  promptAction: PromptAction;
  onOpenChange: VoidFunction;
  handleDeletePrompt: () => Promise<void>;
}

export const DeletePromptDialog = ({
  promptAction,
  onOpenChange,
  handleDeletePrompt,
}: DeletePromptDialogProps) => (
  <AlertDialog
    open={promptAction.action === 'delete'}
    onOpenChange={() => promptAction.action !== null && onOpenChange()}
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete the saved
          prompt.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={handleDeletePrompt}>
          Continue
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
