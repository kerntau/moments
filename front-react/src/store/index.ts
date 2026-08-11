import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoginResp, SysConfigVO, UserVO } from '@/types';

interface GlobalState {
  userinfo: Partial<LoginResp>;
  setUserinfo: (userinfo: Partial<LoginResp>) => void;
  sysConfig: Partial<SysConfigVO>;
  setSysConfig: (sysConfig: Partial<SysConfigVO>) => void;
  currentUser: Partial<UserVO>;
  setCurrentUser: (user: Partial<UserVO>) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentCommentBox: string;
  setCurrentCommentBox: (id: string) => void;
  memoReloadTrigger: number;
  reloadMemos: () => void;
  memoChangedId: number;
  notifyMemoChanged: (id: number) => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      userinfo: {},
      setUserinfo: (userinfo) => set({ userinfo }),
      sysConfig: {},
      setSysConfig: (sysConfig) => set({ sysConfig }),
      currentUser: {},
      setCurrentUser: (currentUser) => set({ currentUser }),
      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      currentCommentBox: '',
      setCurrentCommentBox: (currentCommentBox) => set({ currentCommentBox }),
      memoReloadTrigger: 0,
      reloadMemos: () => set((state) => ({ memoReloadTrigger: state.memoReloadTrigger + 1 })),
      memoChangedId: 0,
      notifyMemoChanged: (memoChangedId) => set({ memoChangedId }),
    }),
    {
      name: 'global',
      partialize: (state) => ({ userinfo: state.userinfo }),
    }
  )
);
