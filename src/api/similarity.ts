import http from './http';

export async function rebuildSimilarity(scope?: string): Promise<void> {
  const payload: any = {};
  if (scope && scope.trim()) payload.scope = scope.trim();
  const { data } = await http.post('/Similarity/rebuildSimilarity', payload);
  if (data && typeof data === 'object' && 'error' in data && (data as any).error) {
    throw new Error((data as any).error);
  }
}

export async function neighbors(item: string, k: number): Promise<string[]> {
  const req = { item, k: Math.max(1, Math.floor(k || 1)) };
  const { data } = await http.post('/Similarity/neighbors', req);
  if (data && typeof data === 'object') {
    if ('error' in data && (data as any).error) throw new Error((data as any).error);
    if ('neighbors' in data && Array.isArray((data as any).neighbors)) {
      return (data as any).neighbors.filter((x: any) => typeof x === 'string');
    }
  }
  // Accept array fallback: ["id1", "id2"]
  if (Array.isArray(data)) return data.filter((x: any) => typeof x === 'string');
  return [];
}
