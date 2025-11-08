import { defineStore } from 'pinia';
import { createVisit, getVisitsByUser, getEntriesByVisit, addEntry as apiAddEntry, removeEntry as apiRemoveEntry, removeVisit as apiRemoveVisit, type Visit, type VisitEntry } from '../api/visit';

export type UserId = string;

export interface VisitsState {
  visitsByUser: Record<UserId, Visit[]>;
  entriesByVisit: Record<string, VisitEntry[]>; // visitId -> entries
  loadingVisits: Record<UserId, boolean>;
  loadingEntries: Record<string, boolean>;
}

export const useVisitsStore = defineStore('visits', {
  state: (): VisitsState => ({
    visitsByUser: {},
    entriesByVisit: {},
    loadingVisits: {},
    loadingEntries: {},
  }),
  getters: {
    visitsForUser: (s) => (userId: UserId): Visit[] => s.visitsByUser[userId] || [],
    entriesForVisit: (s) => (visitId: string): VisitEntry[] => s.entriesByVisit[visitId] || [],
  },
  actions: {
    clearLocal(userId?: UserId) {
      if (userId) {
        delete this.visitsByUser[userId];
      } else {
        this.visitsByUser = {} as any;
      }
      this.entriesByVisit = {} as any;
    },
    setVisits(userId: UserId, visits: Visit[]) {
      this.visitsByUser[userId] = visits;
    },
    setEntries(visitId: string, entries: VisitEntry[]) {
      this.entriesByVisit[visitId] = entries;
    },
    setLoadingVisits(userId: UserId, val: boolean) {
      this.loadingVisits[userId] = val;
    },
    setLoadingEntries(visitId: string, val: boolean) {
      this.loadingEntries[visitId] = val;
    },
    async syncVisits(userId: UserId) {
      this.setLoadingVisits(userId, true);
      try {
        const visits = await getVisitsByUser(userId);
        this.setVisits(userId, visits);
      } finally {
        this.setLoadingVisits(userId, false);
      }
    },
    async syncEntries(visitId: string) {
      this.setLoadingEntries(visitId, true);
      try {
        const entries = await getEntriesByVisit(visitId);
        this.setEntries(visitId, entries);
      } finally {
        this.setLoadingEntries(visitId, false);
      }
    },
    async create(userId: UserId, museum: string, title?: string) {
      const id = await createVisit(userId, museum, title);
      // Optimistically insert a minimal visit so the list updates immediately
      const now = new Date().toISOString();
      const current = this.visitsByUser[userId] || [];
      const optimistic = { _id: id, owner: userId, museum, title, createdAt: now, updatedAt: now } as any;
      this.setVisits(userId, [optimistic, ...current]);
      // Fetch fresh list after creation to reconcile with server
      await this.syncVisits(userId);
      return id;
    },
    async addEntry(visitId: string, exhibit: string, userId: UserId, note: string, photoUrls: string[], rating: number) {
      // Validate required fields before calling API
      if (typeof note !== 'string' || note.trim() === '') {
        throw new Error('Note is required');
      }
      if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
        throw new Error('At least one photo is required');
      }
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      await apiAddEntry(visitId, exhibit, userId, note, photoUrls, rating);
      await this.syncEntries(visitId);
    },
    async removeEntry(visitEntryId: string, visitId: string, userId: UserId) {
      // New semantics: removing an entry cascades removal of the entire visit
      // Optimistically drop visit + entries from local state
      const beforeVisits = (this.visitsByUser[userId] || []).slice();
      const beforeEntries = this.entriesByVisit[visitId];
      this.setVisits(userId, beforeVisits.filter(v => v._id !== visitId));
      delete this.entriesByVisit[visitId];
      try {
        await apiRemoveEntry(visitEntryId, userId);
        // Notify listeners (e.g., stats components) that reviews/ratings may have changed.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('reviews-changed'));
        }
      } catch (e) {
        // Rollback on failure
        this.setVisits(userId, beforeVisits);
        if (beforeEntries) this.setEntries(visitId, beforeEntries);
        await this.syncVisits(userId);
        throw e;
      }
    },
    async removeVisit(visitId: string, userId: UserId) {
      // Optimistically drop from state
      const before = (this.visitsByUser[userId] || []).slice();
      this.setVisits(userId, before.filter(v => v._id !== visitId));
      const prevEntries = this.entriesByVisit[visitId];
      delete this.entriesByVisit[visitId];
      try {
        await apiRemoveVisit(visitId, userId);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('reviews-changed'));
        }
      } catch (e) {
        // Roll back on failure and re-sync from server to be safe
        this.setVisits(userId, before);
        if (prevEntries) this.setEntries(visitId, prevEntries);
        await this.syncVisits(userId);
        throw e;
      }
    },
  },
});
