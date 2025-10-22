import http from './http';

export async function getFollowers(user: string): Promise<string[]> {
  const { data } = await http.post('/Following/_getFollowers', { user });
  // data: [{ follower: string }]
  return Array.isArray(data) ? data.map((x: any) => x.follower) : [];
}

export async function getFollowees(user: string): Promise<string[]> {
  const { data } = await http.post('/Following/_getFollowees', { user });
  // data: [{ followee: string }]
  return Array.isArray(data) ? data.map((x: any) => x.followee) : [];
}

export async function follow(follower: string, followee: string): Promise<void> {
  const { data } = await http.post('/Following/follow', { follower, followee });
  if (data && typeof data === 'object' && 'error' in data && (data as any).error) {
    const msg = (data as any).error as string;
    throw new Error(msg || 'Follow failed');
  }
}

export async function unfollow(follower: string, followee: string): Promise<void> {
  const { data } = await http.post('/Following/unfollow', { follower, followee });
  if (data && typeof data === 'object' && 'error' in data && (data as any).error) {
    const msg = (data as any).error as string;
    throw new Error(msg || 'Unfollow failed');
  }
}

export async function areFriends(userA: string, userB: string): Promise<boolean> {
  const { data } = await http.post('/Following/_areFriends', { userA, userB });
  if (data && typeof data === 'object' && 'error' in data && (data as any).error) {
    const msg = (data as any).error as string;
    throw new Error(msg || 'Failed to check friendship');
  }
  // data: [{ areFriends: boolean }]
  if (Array.isArray(data) && data.length && 'areFriends' in data[0]) {
    return !!data[0].areFriends;
  }
  return false;
}
