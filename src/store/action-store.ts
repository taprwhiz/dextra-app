import { create } from 'zustand';

interface ActionStore {
  actionCount: number;
  incrementCount: () => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const useActionStore = create<ActionStore>((set) => ({
  actionCount: 0,
  incrementCount: () =>
    set((state) => ({ actionCount: state.actionCount + 1 })),
  refreshTrigger: 0,
  triggerRefresh: () =>
    set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
