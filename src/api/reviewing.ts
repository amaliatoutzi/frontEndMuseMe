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
  // data: [{ review: {...} }]
  if (!Array.isArray(data)) return [];
  return data
    .map((x: any) => x?.review || x)
    .filter((r: any) => r && typeof r === 'object' && r.item && r.stars != null);
}

export async function upsertReview(user: string, item: string, stars: number, note?: string): Promise<void> {
  const payload: any = { user, item, stars };
  if (note && note.trim()) payload.note = note.trim();
  const { data } = await http.post('/Reviewing/upsertReview', payload);
  if (data && data.error) throw new Error(data.error);
}
