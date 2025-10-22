import { defineStore } from 'pinia';

export type UserId = string;

export interface ProfileData {
  displayName?: string;
  avatarUrl?: string;
}

export interface ProfileState {
  profilesByUser: Record<UserId, ProfileData>;
}

export const PROFILE_STORAGE_KEY = 'museme.profile.v1';

function loadPersistedProfiles(): Record<UserId, ProfileData> {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') return parsed as Record<UserId, ProfileData>;
    return {};
  } catch {
    return {};
  }
}

export const useProfileStore = defineStore('profile', {
  state: (): ProfileState => ({
    profilesByUser: loadPersistedProfiles(),
  }),
  getters: {
    profileFor: (s) => (userId: UserId): ProfileData | undefined => s.profilesByUser[userId],
  },
  actions: {
    persist() {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.profilesByUser));
    },
    setProfile(userId: UserId, data: ProfileData) {
      this.profilesByUser[userId] = { ...(this.profilesByUser[userId] || {}), ...data };
      this.persist();
    },
    setDisplayName(userId: UserId, displayName?: string) {
      this.setProfile(userId, { displayName });
    },
    setAvatarUrl(userId: UserId, avatarUrl?: string) {
      this.setProfile(userId, { avatarUrl });
    },
  },
});
