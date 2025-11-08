import http from './http';

export async function getFollowers(user: string): Promise<string[]> {
  const { data } = await http.post('/Following/_getFollowers', { user });
  // Accept:
  //  - row array [{ follower }]
  //  - aggregated { followers: string[] }
  //  - aggregated { followers: Array<{ follower: string }> }
  if (Array.isArray(data)) {
    return data
      .map((x: any) => (x && typeof x === 'object' ? x.follower : null))
      .filter((v: any) => typeof v === 'string');
  }
  if (data && typeof data === 'object' && Array.isArray((data as any).followers)) {
    const arr = (data as any).followers;
    if (arr.length && typeof arr[0] === 'object') {
      return arr
        .map((x: any) => (x && typeof x === 'object' ? x.follower : null))
        .filter((v: any) => typeof v === 'string');
    }
    return arr.filter((v: any) => typeof v === 'string');
  }
  return [];
}

export async function getFollowees(user: string): Promise<string[]> {
  const { data } = await http.post('/Following/_getFollowees', { user });
  // Accept:
  //  - row array [{ followee }]
  //  - aggregated { followees: string[] }
  //  - aggregated { followees: Array<{ followee: string }> }
  if (Array.isArray(data)) {
    return data
      .map((x: any) => (x && typeof x === 'object' ? x.followee : null))
      .filter((v: any) => typeof v === 'string');
  }
  if (data && typeof data === 'object' && Array.isArray((data as any).followees)) {
    const arr = (data as any).followees;
    if (arr.length && typeof arr[0] === 'object') {
      return arr
        .map((x: any) => (x && typeof x === 'object' ? x.followee : null))
        .filter((v: any) => typeof v === 'string');
    }
    return arr.filter((v: any) => typeof v === 'string');
  }
  return [];
}

export async function follow(follower: string, followee: string): Promise<void> {
  const { data } = await http.post('/Following/follow', { follower, followee });
  if (data && typeof data === 'object' && 'error' in data && (data as any).error) {
    const msg = String((data as any).error || 'Follow failed');
    // Treat duplicate follow as success (idempotent UX)
    if (!/already\s+following/i.test(msg)) {
      throw new Error(msg);
    }
  }
  // Emit a global event so UI layers (profile, panels, search) can refresh connection counts/state
  try {
    window.dispatchEvent(new CustomEvent('following-changed', { detail: { action: 'follow', follower, followee } }));
  } catch { /* ignore (e.g., SSR) */ }
}

export async function unfollow(follower: string, followee: string): Promise<void> {
  const { data } = await http.post('/Following/unfollow', { follower, followee });
  if (data && typeof data === 'object' && 'error' in data && (data as any).error) {
    const msg = (data as any).error as string;
    throw new Error(msg || 'Unfollow failed');
  }
  // Emit event for UI refresh
  try {
    window.dispatchEvent(new CustomEvent('following-changed', { detail: { action: 'unfollow', follower, followee } }));
  } catch { /* ignore */ }
}

export async function areFriends(userA: string, userB: string): Promise<boolean> {
  const { data } = await http.post('/Following/_areFriends', { userA, userB });
  if (data && typeof data === 'object' && 'error' in data && (data as any).error) {
    const msg = (data as any).error as string;
    throw new Error(msg || 'Failed to check friendship');
  }
  // Accept both array-of-rows and aggregated object
  if (Array.isArray(data) && data.length && 'areFriends' in data[0]) return !!data[0].areFriends;
  if (data && typeof data === 'object' && 'areFriends' in (data as any)) return !!(data as any).areFriends;
  return false;
}
