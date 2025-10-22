import http from './http';

export async function getPreferencesForUser(user: string): Promise<string[]> {
  const { data } = await http.post('/UserPreferences/_getPreferencesForUser', { user });
  // data: [{ tag: string }]
  return Array.isArray(data) ? data.map((x: any) => x.tag) : [];
}

export async function addPreference(user: string, tag: string): Promise<void> {
  await http.post('/UserPreferences/addPreference', { user, tag });
}

export async function removePreference(user: string, tag: string): Promise<void> {
  await http.post('/UserPreferences/removePreference', { user, tag });
}
