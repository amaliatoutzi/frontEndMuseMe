import http from './http';

export interface ReviewDTO {
  _id: string;
  user: string;
  item: string;
  stars: number;
  note?: string;
  updatedAt: string;
}

export async function getReviewsByUser(user: string): Promise<ReviewDTO[]> {
  const { data } = await http.post('/Reviewing/_getReviewsByUser', { user });
  // Accept both row array [{ review }] and aggregated { reviews }
  const fromArray = Array.isArray(data)
    ? data.map((x: any) => x?.review || x)
    : [];
  if (fromArray.length) {
    return fromArray.filter((r: any) => r && typeof r === 'object' && r.item && r.stars != null);
  }
  if (data && typeof data === 'object' && Array.isArray((data as any).reviews)) {
    return (data as any).reviews.filter((r: any) => r && typeof r === 'object' && r.item && r.stars != null);
  }
  return [];
}

export async function upsertReview(user: string, item: string, stars: number, note?: string): Promise<void> {
  if (note === undefined || note.trim() === '') {
    throw new Error('Review note is required');
  }
  if (typeof stars !== 'number' || stars < 1 || stars > 5) {
    throw new Error('Stars must be between 1 and 5');
  }
  const payload: any = { user, item, stars, note: note.trim() };
  const { data } = await http.post('/Reviewing/upsertReview', payload);
  if (data && data.error) throw new Error(data.error);
}
