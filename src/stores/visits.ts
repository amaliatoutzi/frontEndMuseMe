import { defineStore } from 'pinia';
import { createVisit, getVisitsByUser, getEntriesByVisit, addEntry as apiAddEntry, editEntry as apiEditEntry, removeEntry as apiRemoveEntry, removeVisit as apiRemoveVisit, type Visit, type VisitEntry } from '../api/visit';

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
    async addEntry(visitId: string, exhibit: string, userId: UserId, note?: string, photoUrl?: string) {
      // optimistic: add a placeholder entry id? We'll just sync after API.
      await apiAddEntry(visitId, exhibit, userId, note, photoUrl);
      await this.syncEntries(visitId);
    },
    async editEntry(visitEntryId: string, visitId: string, userId: UserId, note?: string, photoUrl?: string) {
      await apiEditEntry(visitEntryId, userId, note, photoUrl);
      await this.syncEntries(visitId);
    },
    async removeEntry(visitEntryId: string, visitId: string, userId: UserId) {
      await apiRemoveEntry(visitEntryId, userId);
      await this.syncEntries(visitId);
    },
    async removeVisit(visitId: string, userId: UserId) {
      // Optimistically drop from state
      const before = (this.visitsByUser[userId] || []).slice();
      this.setVisits(userId, before.filter(v => v._id !== visitId));
      const prevEntries = this.entriesByVisit[visitId];
      delete this.entriesByVisit[visitId];
      try {
        await apiRemoveVisit(visitId, userId);
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
