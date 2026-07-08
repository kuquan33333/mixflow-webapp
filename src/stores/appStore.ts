import { create } from 'zustand';

export type Tab = 'feed' | 'reels' | 'create' | 'chat' | 'profile';

type AppState = {
  activeTab: Tab;
  viewingProfileId: string | null;
  isReelsActive: boolean;
  isFullPlayerOpen: boolean;
  setActiveTab: (tab: Tab) => void;
  setViewingProfileId: (id: string | null) => void;
  setReelsActive: (active: boolean) => void;
  setFullPlayerOpen: (open: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'feed',
  viewingProfileId: null,
  isReelsActive: false,
  isFullPlayerOpen: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setViewingProfileId: (id) => set({ viewingProfileId: id }),
  setReelsActive: (active) => set({ isReelsActive: active }),
  setFullPlayerOpen: (open) => set({ isFullPlayerOpen: open }),
}));
