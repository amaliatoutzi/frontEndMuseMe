import { defineStore } from 'pinia';
import http from '../api/http';

export const STORAGE_KEY = 'museme.auth.userId';

export interface AuthState {
  currentUserId: string | null;
  currentUsername: string | null;
  loading: boolean;
  error: string | null;
}

function loadPersistedUser(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const USERNAME_STORAGE_KEY = 'museme.auth.username';
function loadPersistedUsername(): string | null {
  try {
    const raw = localStorage.getItem(USERNAME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    currentUserId: loadPersistedUser(),
    currentUsername: loadPersistedUsername(),
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (s) => !!s.currentUserId,
  },
  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUserId));
      localStorage.setItem(USERNAME_STORAGE_KEY, JSON.stringify(this.currentUsername));
    },
    clearError() {
      this.error = null;
    },
    async register(username: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        console.log('[AUTH] Registering user:', username);
        const { data } = await http.post('/UserAuthentication/register', {
          username,
          password,
        });
        console.log('[AUTH] Register response:', data);
        // Handle backends that return 200 with an { error } body
        if (!data || typeof data !== 'object') {
          const msg = 'Registration failed: unexpected response';
          this.error = msg;
          throw new Error(msg);
        }
        if ('error' in data && (data as any).error) {
          const msg = (data as any).error as string;
          this.error = msg || 'Registration failed';
          throw new Error(this.error);
        }
        if (!('user' in data) || !(data as any).user) {
          const msg = 'Registration failed';
          this.error = msg;
          throw new Error(msg);
        }
        // Expecting { user: string } -> we treat as backend user identifier
        this.currentUserId = (data as any).user as string;
        // Also persist the username used to sign in/register for display and username-based actions
        this.currentUsername = username;
        this.persist();
        return data;
      } catch (err: any) {
        console.error('[AUTH] Register error:', err);
        console.error('[AUTH] Response data:', err?.response?.data);
        console.error('[AUTH] Response status:', err?.response?.status);
        const apiMsg: string | undefined = err?.response?.data?.error;
        if (apiMsg) {
          this.error = apiMsg;
        } else if (!this.error) {
          // Preserve any error we already set from the 200-with-error path
          this.error = 'Registration failed';
        }
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async login(username: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        console.log('[AUTH] Authenticating user:', username);
        const { data } = await http.post('/UserAuthentication/authenticate', {
          username,
          password,
        });
        console.log('[AUTH] Login response:', data);
        // Handle backends that return 200 with an { error } body
        if (!data || typeof data !== 'object') {
          const msg = 'Authentication failed: unexpected response';
          this.error = msg;
          throw new Error(msg);
        }
        if ('error' in data && (data as any).error) {
          const msg = (data as any).error as string;
          this.error = msg || 'Authentication failed';
          throw new Error(this.error);
        }
        if (!('user' in data) || !(data as any).user) {
          const msg = 'Authentication failed';
          this.error = msg;
          throw new Error(msg);
        }
        // Expecting { user: string } -> we treat as backend user identifier
        this.currentUserId = (data as any).user as string;
        // Also persist the username used to sign in/register for display and username-based actions
        this.currentUsername = username;
        this.persist();
        return data;
      } catch (err: any) {
        console.error('[AUTH] Login error:', err);
        console.error('[AUTH] Response data:', err?.response?.data);
        console.error('[AUTH] Response status:', err?.response?.status);
        const apiMsg: string | undefined = err?.response?.data?.error;
        if (apiMsg) {
          this.error = apiMsg;
        } else if (!this.error) {
          this.error = 'Authentication failed';
        }
        throw err;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.currentUserId = null;
      this.currentUsername = null;
      this.persist();
    },
  },
});
