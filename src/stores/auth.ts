import { defineStore } from 'pinia';
import http, { setSessionToken } from '../api/http';

export const STORAGE_KEY = 'museme.auth.userId';

export interface AuthState {
  currentUserId: string | null;
  currentUsername: string | null;
  sessionToken: string | null;
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

export const SESSION_STORAGE_KEY = 'museme.auth.sessionToken';
function loadPersistedSessionToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Initialize http layer with any persisted token early
try { setSessionToken(loadPersistedSessionToken()); } catch {}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    currentUserId: loadPersistedUser(),
    currentUsername: loadPersistedUsername(),
    sessionToken: loadPersistedSessionToken(),
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (s) => !!s.currentUserId,
  },
  actions: {
    // Try to extract a session token from various backend response shapes
    // Supported forms:
    //  - data.sessionToken
    //  - data.token
    //  - data.session.token
    //  - data.session (string)
    //  - data.session.id | data.session._id
    //  - data.sessionId
    //  - Array payloads with any of the above in the first element
    _extractToken(data: any): string | null {
      if (!data) return null;
      const scan = (obj: any): string | null => {
        if (!obj) return null;
        if (typeof obj === 'string') return obj;
        if (typeof obj !== 'object') return null;
        if (obj.sessionToken) return String(obj.sessionToken);
        if (obj.token) return String(obj.token);
        if (obj.session) {
          const s = obj.session;
          if (typeof s === 'string') return s;
          if (s && typeof s === 'object') {
            if ('token' in s && s.token) return String(s.token);
            if ('id' in s && s.id) return String(s.id);
            if ('_id' in s && s._id) return String(s._id);
          }
        }
        if (obj.sessionId) return String(obj.sessionId);
        return null;
      };
      if (Array.isArray(data) && data.length) {
        return scan(data[0]);
      }
      return scan(data);
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUserId));
      localStorage.setItem(USERNAME_STORAGE_KEY, JSON.stringify(this.currentUsername));
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.sessionToken));
      setSessionToken(this.sessionToken);
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
        // Robust token capture for EXCLUDED routes handled by backend syncs
        const token = this._extractToken(data);
  this.sessionToken = token ?? null;
        this.persist();
        if (!this.sessionToken) console.warn('[AUTH] No session token in register response. Expected sessionToken | token | session.token | session | session.id | session._id | sessionId');
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
        // Robust token capture for EXCLUDED routes handled by backend syncs
        const token = this._extractToken(data);
  this.sessionToken = token ?? null;
        this.persist();
        if (!this.sessionToken) console.warn('[AUTH] No session token in login response. Expected sessionToken | token | session.token | session | session.id | session._id | sessionId');
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
      this.sessionToken = null;
      this.persist();
    },
  },
});
