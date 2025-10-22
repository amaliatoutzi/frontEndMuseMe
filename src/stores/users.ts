import { defineStore } from 'pinia';

export interface UsersState {
  idToUsername: Record<string, string>;
  usernameToId: Record<string, string>;
}

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    idToUsername: {},
    usernameToId: {},
  }),
  getters: {
    getUsername: (s) => (id: string): string | undefined => s.idToUsername[id],
    getUserId: (s) => (username: string): string | undefined => s.usernameToId[username],
  },
  actions: {
    setMapping(id: string, username: string) {
      if (!id || !username) return;
      this.idToUsername[id] = username;
      this.usernameToId[username] = id;
    },
    setMany(mappings: Array<{ id: string; username: string }>) {
      for (const { id, username } of mappings) this.setMapping(id, username);
    },
  },
});
