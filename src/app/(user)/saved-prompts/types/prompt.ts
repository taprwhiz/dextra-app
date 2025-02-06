export interface FilterOption {
  value: FilterValue;
  label: string;
}

export type FilterValue =
  | 'recentlyUsed'
  | 'editedRecently'
  | 'latest'
  | 'oldest'
  | 'favorites';

export interface PromptAction {
  action: 'update' | 'delete' | 'save' | null;
  id: string | null;
}
