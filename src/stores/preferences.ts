import { defineStore } from 'pinia';
import { getPreferencesForUser } from '../api/userPreferences';

export type UserId = string;

export interface PreferencesState {
  // userId -> array of tags
  prefsByUser: Record<UserId, string[]>;
}

export const PREFERENCES_STORAGE_KEY = 'museme.prefs.v1';

function loadPersistedPrefs(): Record<UserId, string[]> {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    // Ensure proper shape
    if (parsed && typeof parsed === 'object') return parsed as Record<UserId, string[]>;
    return {};
  } catch {
    return {};
  }
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

export const usePreferencesStore = defineStore('preferences', {
  state: (): PreferencesState => ({
    prefsByUser: loadPersistedPrefs(),
  }),
  getters: {
    tagsForUser: (s) => (userId: UserId): string[] => s.prefsByUser[userId] || [],
  },
  actions: {
    persist() {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(this.prefsByUser));
    },
    setTags(userId: UserId, tags: string[]) {
      this.prefsByUser[userId] = unique(tags);
      this.persist();
    },
    mergeTags(userId: UserId, tags: string[]) {
      const current = this.prefsByUser[userId] || [];
      this.prefsByUser[userId] = unique([...current, ...tags]);
      this.persist();
    },
    addTag(userId: UserId, tag: string) {
      const current = this.prefsByUser[userId] || [];
      if (!current.includes(tag)) {
        this.prefsByUser[userId] = [...current, tag];
        this.persist();
      }
    },
    removeTag(userId: UserId, tag: string) {
      const current = this.prefsByUser[userId] || [];
      this.prefsByUser[userId] = current.filter((t) => t !== tag);
      this.persist();
    },
    async syncFromServer(userId: UserId) {
      try {
        const serverTags = await getPreferencesForUser(userId);
        const localTags = this.prefsByUser[userId] || [];
        // Non-destructive merge: prefer union so local optimistic tags are kept
        const merged = unique([...localTags, ...serverTags]);
        this.prefsByUser[userId] = merged;
        this.persist();
      } catch (e) {
        // If server call fails, keep local state; no-op
        console.warn('[PREFERENCES] syncFromServer failed; using local state');
      }
    },
  },
});
