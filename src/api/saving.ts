import http from './http';

export async function saveItem(user: string, item: string): Promise<void> {
  const { data } = await http.post('/Saving/saveItem', { user, item });
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(data.error);
  }
}

export async function unsaveItem(user: string, item: string): Promise<void> {
  const { data } = await http.post('/Saving/unsaveItem', { user, item });
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(data.error);
  }
}

export async function listSaved(user: string, limit?: number): Promise<string[]> {
  const { data } = await http.post('/Saving/_listSaved', { user, ...(limit ? { limit } : {}) });
  if (Array.isArray(data)) {
    return data
      .map((row: any) => (row && typeof row === 'object' ? (row.item as string) : undefined))
      .filter((x: any) => typeof x === 'string');
  }
  if (data && typeof data === 'object' && Array.isArray((data as any).items)) {
    return (data as any).items.filter((x: any) => typeof x === 'string');
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(data.error);
  }
  return [];
}
