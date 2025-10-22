import nyc from '../../catalog/new-york-museums.json';

// Types for the catalog content
export type Exhibit = {
  id: string;
  name: string;
  type?: string;
  gallery?: string;
  start_date?: string;
  end_date?: string;
};

export type Museum = {
  id: string;
  name: string;
  address?: string;
  zip?: string;
  borough?: string;
  location?: { lat: number; lon: number };
  website?: string;
  tags?: string[];
  exhibits?: Exhibit[];
  [k: string]: any;
};

// Expecting a JSON array of Museum
const arr = (nyc as any[]);
export const allMuseums: Museum[] = Array.isArray(arr)
  ? arr.filter((m) => m && typeof m === 'object')
  : [];

// Map id -> display name for convenience
const mapById: Record<string, string> = {};
// Map id -> museum object
const byId: Record<string, Museum> = {} as any;
for (const m of allMuseums) {
  const id = (m.id || (m as any)._id || (m as any).slug || (m as any).code || m.name) as string;
  const name = (m.name || (m as any).title || id) as string;
  if (id) mapById[id] = name;
  if (id) byId[id] = m as Museum;
}

export function itemName(itemId: string): string {
  return mapById[itemId] || `[Item: ${itemId}]`;
}

export function getMuseumById(id: string): Museum | undefined {
  return byId[id];
}

export function listExhibits(museumId: string): Exhibit[] {
  const m = getMuseumById(museumId);
  return (m?.exhibits || []) as Exhibit[];
}

export function exhibitName(museumId: string, exhibitId: string): string {
  const ex = listExhibits(museumId).find((e) => e.id === exhibitId);
  return ex?.name || `[Exhibit: ${exhibitId}]`;
}

export function listBoroughs(): string[] {
  const set = new Set<string>();
  for (const m of allMuseums) if (m.borough) set.add(m.borough);
  return Array.from(set).sort();
}

export function listTags(): string[] {
  const set = new Set<string>();
  for (const m of allMuseums) (m.tags || []).forEach((t) => set.add(t));
  return Array.from(set).sort();
}

export type SearchFilters = {
  borough?: string;
  tags?: string[]; // match any of these tags (OR); if empty or undefined, ignore
};

export function searchMuseums(query: string, filters: SearchFilters = {}): Museum[] {
  const q = (query || '').trim().toLowerCase();
  const { borough, tags } = filters;
  const hasTags = Array.isArray(tags) && tags.length > 0;

  return allMuseums.filter((m) => {
    if (borough && m.borough !== borough) return false;
    if (hasTags) {
      const mt = new Set(m.tags || []);
      const any = tags!.some((t) => mt.has(t));
      if (!any) return false;
    }
    if (!q) return true;
    const hay = [m.name, m.address, m.borough, (m.tags || []).join(' ')].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
}
