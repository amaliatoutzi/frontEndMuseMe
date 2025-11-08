import http from './http';

const usernameToIdCache = new Map<string, string>();
const idToUsernameCache = new Map<string, string>();

// Attempts to resolve a username to a backend user id (string).
// Expected backend endpoint: POST /UserAuthentication/_getUserByUsername
// Request: { username }
// Success: { user: string } or [ { user: string } ] or any object containing a 'user' field
// Error: { error: string }
export async function getUserIdByUsername(username: string): Promise<string | null> {
  try {
    const key = username.trim();
    if (!key) return null;
    if (usernameToIdCache.has(key)) return usernameToIdCache.get(key)!;
  const { data } = await http.post('/Following/_getUserIdByUsername', { username });
    if (data && typeof data === 'object') {
      if ('error' in data && (data as any).error) return null;
      if ('user' in data) {
        const id = (data as any).user as string;
        if (id) usernameToIdCache.set(key, id);
        return id;
      }
    }
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      if (first && typeof first === 'object' && 'user' in first) {
        const id = first.user as string;
        if (id) usernameToIdCache.set(key, id);
        return id;
      }
    }
    return null;
  } catch (e: any) {
    // If the endpoint doesn't exist, backend returns 404. Treat as unsupported lookup.
    if (e?.response?.status === 404) {
      throw new Error('Username lookup endpoint not available (404)');
    }
    throw e;
  }
}

// Reverse helper: resolve userId -> username. Optional; if endpoint missing, we surface a clear message.
export async function getUsernameByUserId(userId: string): Promise<string | null> {
  const key = userId.trim();
  if (!key) return null;
  if (idToUsernameCache.has(key)) return idToUsernameCache.get(key)!;

  // Try preferred path first, then fallback to an alternate namespace if needed
  const tryPaths = ['/Following/_getUsernameByUserId', '/UserAuthentication/_getUsernameByUserId'];

  for (const path of tryPaths) {
    try {
      const { data } = await http.post(path, { user: key });
      // Accept both object and array response shapes
      const parse = (payload: any): string | null => {
        if (!payload) return null;
        if (Array.isArray(payload)) {
          const first = payload[0];
          if (first && typeof first === 'object') {
            // Accept 'username' or 'name' keys just in case
            if ('username' in first && first.username) return String(first.username);
            if ('name' in first && first.name) return String(first.name);
          }
          return null;
        }
        if (typeof payload === 'object') {
          if ('error' in payload && (payload as any).error) return null;
          if ('username' in payload && (payload as any).username) return String((payload as any).username);
          if ('name' in payload && (payload as any).name) return String((payload as any).name);
        }
        return null;
      };

      let name = parse(data);
      // Some backends respond { profile: { firstName, lastName, username } } when username is absent
      if (!name && data && typeof data === 'object') {
        const p = (data as any).profile;
        if (p && typeof p === 'object') {
          if (p.username) name = String(p.username);
          else if (p.firstName || p.lastName) name = String([p.firstName, p.lastName].filter(Boolean).join(' '));
        }
      }
      if (name) {
        idToUsernameCache.set(key, name);
        usernameToIdCache.set(name, key);
        return name;
      }
      // If the endpoint returned a valid but empty payload, continue to next path
    } catch (e: any) {
      // If 404, try next path; otherwise rethrow
      if (!(e?.response?.status === 404)) {
        throw e;
      }
      // else continue to next path
    }
  }
  // If none worked, return null; caller will decide how to display
  return null;
}
