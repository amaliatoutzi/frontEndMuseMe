import http from './http';

export type Visit = {
  _id: string;
  owner: string;
  museum: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
};

export type VisitEntry = {
  _id: string;
  visit: string;
  exhibit: string;
  note?: string;
  rating?: number;
  photoUrl?: string; // legacy single-photo support
  photoUrls?: string[]; // preferred multi-photo field
  loggedAt: string;
  updatedAt: string;
};

export async function createVisit(owner: string, museum: string, title?: string): Promise<string> {
  const { data } = await http.post('/Visit/createVisit', { owner, museum, ...(title ? { title } : {}) });
  if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(data.error);
  const id = (data && data.visitId) as string | undefined;
  if (!id) throw new Error('Missing visitId');
  return id;
}

export async function getVisitsByUser(user: string): Promise<Visit[]> {
  // Try multiple payload shapes and response shapes to be robust to backend variations
  const tryParse = (payload: any): Visit[] => {
    if (!Array.isArray(payload)) return [];
    // Case 1: [{ visit: {...} }]
    const withVisit = payload
      .map((row: any) => (row && typeof row === 'object' && 'visit' in row ? (row.visit as Visit) : undefined))
      .filter(Boolean) as Visit[];
    if (withVisit.length) return withVisit;
    // Case 2: [{ Visit: {...} }]
    const withVisitCap = payload
      .map((row: any) => (row && typeof row === 'object' && 'Visit' in row ? (row.Visit as Visit) : undefined))
      .filter(Boolean) as Visit[];
    if (withVisitCap.length) return withVisitCap;
    // Case 3: direct visits array
    const direct = payload
      .map((row: any) => (row && typeof row === 'object' && row._id ? (row as Visit) : undefined))
      .filter(Boolean) as Visit[];
    return direct;
  };

  // Attempt 1: { user }
  let resp = await http.post('/Visit/_getVisitsByUser', { user });
  let visits = tryParse(resp.data);
  if (visits.length) return visits;
  if (resp.data && typeof resp.data === 'object' && 'error' in resp.data && (resp.data as any).error) {
    throw new Error((resp.data as any).error);
  }
  // Attempt 2: some backends expect { owner }
  resp = await http.post('/Visit/_getVisitsByUser', { owner: user });
  visits = tryParse(resp.data);
  if (visits.length) return visits;
  // Attempt 3: fallback endpoint name
  try {
    resp = await http.post('/Visit/_getVisitsByOwner', { owner: user });
    visits = tryParse(resp.data);
    if (visits.length) return visits;
  } catch (_) { /* ignore */ }
  return [];
}

export async function getEntriesByVisit(visitId: string): Promise<VisitEntry[]> {
  const parse = (payload: any): VisitEntry[] => {
    if (!Array.isArray(payload)) return [];
    // case 1: [{ entry: {...} }]
    const lower = payload
      .map((row: any) => (row && typeof row === 'object' && 'entry' in row ? (row.entry as VisitEntry) : undefined))
      .filter(Boolean) as VisitEntry[];
    if (lower.length) return lower;
    // case 2: [{ Entry: {...} }]
    const upper = payload
      .map((row: any) => (row && typeof row === 'object' && 'Entry' in row ? (row.Entry as VisitEntry) : undefined))
      .filter(Boolean) as VisitEntry[];
    if (upper.length) return upper;
    // case 3: direct array of entries
    const direct = payload
      .map((row: any) => (row && typeof row === 'object' && row._id && row.visit ? (row as VisitEntry) : undefined))
      .filter(Boolean) as VisitEntry[];
    return direct;
  };

  // primary endpoint
  let resp = await http.post('/Visit/_getEntriesByVisit', { visitId });
  let entries = parse(resp.data);
  if (entries.length) return entries;
  if (resp.data && typeof resp.data === 'object' && 'error' in resp.data && (resp.data as any).error) {
    throw new Error((resp.data as any).error);
  }
  // fallback endpoint naming
  try {
    resp = await http.post('/Visit/_listEntriesByVisit', { visitId });
    entries = parse(resp.data);
    if (entries.length) return entries;
  } catch (_) { /* ignore */ }
  return [];
}

export async function addEntry(
  visit: string,
  exhibit: string,
  user: string,
  note?: string,
  photoUrls?: string[],
  rating?: number
): Promise<void> {
  const payload: any = { visit, exhibit, user };
  if (note !== undefined) payload.note = note;
  if (Array.isArray(photoUrls) && photoUrls.length) payload.photoUrls = photoUrls;
  if (rating !== undefined) payload.rating = rating;
  const { data } = await http.post('/Visit/addEntry', payload);
  if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(data.error);
}

export async function editEntry(
  visitEntryId: string,
  user: string,
  note?: string,
  photoUrls?: string[],
  rating?: number
): Promise<void> {
  const payload: any = { visitEntryId, user };
  if (note !== undefined) payload.note = note;
  if (Array.isArray(photoUrls)) payload.photoUrls = photoUrls; // replace full set
  if (rating !== undefined) payload.rating = rating;
  const { data } = await http.post('/Visit/editEntry', payload);
  if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(data.error);
}

export async function removeEntry(visitEntryId: string, user: string): Promise<void> {
  const { data } = await http.post('/Visit/removeEntry', { visitEntryId, user });
  if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(data.error);
}

export async function removeVisit(visitId: string, user: string): Promise<void> {
  // Primary endpoint as designed
  try {
    const { data } = await http.post('/Visit/removeVisit', { visitId, user });
    if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(data.error);
    return;
  } catch (e: any) {
    // If server explicitly reports 404, surface a helpful message
    if (e?.response?.status === 404) {
      throw new Error('Delete visit is not supported by the server (404). Please enable /Visit/removeVisit or /Visit/deleteVisit.');
    }
    // Fallback to alternate naming if backend differs
    const { data } = await http.post('/Visit/deleteVisit', { visitId, user });
    if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(data.error);
  }
}
