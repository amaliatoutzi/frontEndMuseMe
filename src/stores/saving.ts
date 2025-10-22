import { defineStore } from 'pinia';
import { listSaved, saveItem as apiSaveItem, unsaveItem as apiUnsaveItem } from '../api/saving';

export type UserId = string;

export interface SavingState {
  // userId -> array of item ids
  savedByUser: Record<UserId, string[]>;
}

export const SAVING_STORAGE_KEY = 'museme.saved.v1';

function loadPersistedSaving(): Record<UserId, string[]> {
  try {
    const raw = localStorage.getItem(SAVING_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') return parsed as Record<UserId, string[]>;
    return {};
  } catch {
    return {};
  }
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

export const useSavingStore = defineStore('saving', {
  state: (): SavingState => ({
    savedByUser: loadPersistedSaving(),
  }),
  getters: {
    savedForUser: (s) => (userId: UserId): string[] => s.savedByUser[userId] || [],
    isSaved: (s) => (userId: UserId, item: string): boolean => (s.savedByUser[userId] || []).includes(item),
  },
  actions: {
    persist() {
      localStorage.setItem(SAVING_STORAGE_KEY, JSON.stringify(this.savedByUser));
    },
    setSaved(userId: UserId, items: string[]) {
      this.savedByUser[userId] = unique(items);
      this.persist();
    },
    add(userId: UserId, item: string) {
      const cur = this.savedByUser[userId] || [];
      if (!cur.includes(item)) {
        this.savedByUser[userId] = [...cur, item];
        this.persist();
      }
    },
    remove(userId: UserId, item: string) {
      const cur = this.savedByUser[userId] || [];
      this.savedByUser[userId] = cur.filter((i) => i !== item);
      this.persist();
    },
    async syncFromServer(userId: UserId) {
      try {
        const server = await listSaved(userId);
        const local = this.savedByUser[userId] || [];
        this.savedByUser[userId] = unique([...local, ...server]);
        this.persist();
      } catch (e) {
        console.warn('[SAVING] syncFromServer failed; using local state');
      }
    },
    async save(userId: UserId, item: string) {
      // optimistic
      this.add(userId, item);
      try {
        await apiSaveItem(userId, item);
      } catch (e: any) {
        // rollback
        this.remove(userId, item);
        throw e;
      }
    },
    async unsave(userId: UserId, item: string) {
      // optimistic
      const had = this.isSaved(userId, item);
      this.remove(userId, item);
      try {
        await apiUnsaveItem(userId, item);
      } catch (e: any) {
        // rollback
        if (had) this.add(userId, item);
        throw e;
      }
    },
  },
});
