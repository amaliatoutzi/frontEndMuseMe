import http from './http';

export async function getPreferencesForUser(user: string): Promise<string[]> {
  const { data } = await http.post('/UserPreferences/_getPreferencesForUser', { user });
  // Accept both row array [{ tag }] and aggregated { tags }
  if (Array.isArray(data)) return data.map((x: any) => x?.tag).filter((v: any) => typeof v === 'string');
  if (data && typeof data === 'object' && Array.isArray((data as any).tags)) {
    return (data as any).tags.filter((v: any) => typeof v === 'string');
  }
  return [];
}

export async function addPreference(user: string, tag: string): Promise<void> {
  await http.post('/UserPreferences/addPreference', { user, tag });
}

export async function removePreference(user: string, tag: string): Promise<void> {
  await http.post('/UserPreferences/removePreference', { user, tag });
}
