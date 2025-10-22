<template>
  <section class="feed-page">
    <header class="page-header">
      <h2>Friends feed</h2>
    </header>

    <div v-if="!userId" class="status">Login to see your feed.</div>
    <div v-else>
      <div v-if="loading" class="status">Loading…</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="items.length === 0" class="status">No recent activity from mutuals yet.</div>

      <ul v-else class="list">
        <li v-for="it in items" :key="it._key" class="row">
          <div class="row-main">
            <div class="who">
              <span class="avatar" aria-hidden="true">{{ it.initial }}</span>
              <strong class="username">{{ it.username || it.owner }}</strong>
            </div>
            <div class="activity">
              visited <button class="museum linklike" @click="openMuseum(it.museumId)">{{ it.museumName }}</button>
            </div>
          </div>
          <div class="row-right">
            <time :datetime="it.createdAt">{{ formatDate(it.createdAt) }}</time>
            <a class="dir icon-link" :href="it.mapsUrl" target="_blank" rel="noopener" aria-label="Directions" title="Directions">📍</a>
          </div>
          <div v-if="it.photos?.length" class="row-gallery">
            <div class="gallery" aria-label="Visit photos" tabindex="0">
              <div v-for="(p, idx) in it.photos" :key="idx" class="photo">
                <img :src="p" alt="Visit photo" loading="lazy" />
              </div>
            </div>
          </div>
          <div v-if="it.exhibits?.length" class="row-exhibits">
            <span class="label">Exhibits:</span>
            <ul class="chips">
              <li v-for="(ex, i) in it.exhibits" :key="i" class="chip">{{ ex }}</li>
              <li v-if="it.exhibitsMoreCount > 0" class="chip more">+{{ it.exhibitsMoreCount }} more</li>
            </ul>
          </div>
          <div v-if="it.reviewStars != null || it.reviewNote" class="row-review">
            <span v-if="it.reviewStars != null" class="stars" :aria-label="`Rating: ${it.reviewStars} out of 5`">
              {{ '★'.repeat(it.reviewStars) }}{{ '☆'.repeat(Math.max(0, 5 - it.reviewStars)) }}
            </span>
            <p v-if="it.reviewNote" class="note">{{ it.reviewNote }}</p>
          </div>
        </li>
      </ul>

      <!-- Museum modal -->
      <div v-if="selectedMuseumId" class="modal-overlay" role="dialog" aria-modal="true" @click.self="closeModal">
        <div class="modal">
          <header class="modal-header">
            <div class="modal-actions">
              <button
                class="bookmark-btn"
                :disabled="!userId"
                @click="selectedMuseumId && toggleSave(selectedMuseumId)"
                :aria-pressed="selectedMuseumId && isSaved(selectedMuseumId) ? 'true' : 'false'"
                :title="!userId ? 'Login to save' : (selectedMuseumId && isSaved(selectedMuseumId) ? 'Unsave' : 'Save')"
                aria-label="Bookmark"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  :fill="selectedMuseumId && isSaved(selectedMuseumId) ? 'currentColor' : 'none'"
                  :stroke="selectedMuseumId && isSaved(selectedMuseumId) ? 'none' : 'currentColor'"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M6 2h12a2 2 0 0 1 2 2v16l-8-4-8 4V4a2 2 0 0 1 2-2z" />
                </svg>
              </button>
              <button class="close" @click="closeModal" aria-label="Close">✕</button>
            </div>
          </header>
          <div class="modal-body">
            <MuseumCard v-if="selectedMuseumId" :museumId="selectedMuseumId" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { getFollowers, getFollowees } from '../api/following';
import { getUsernameByUserId } from '../api/users';
import { getVisitsByUser, getEntriesByVisit, type Visit, type VisitEntry } from '../api/visit';
import { getReviewsByUser, type ReviewDTO } from '../api/reviewing';
import { getMuseumById, itemName, exhibitName } from '../utils/catalog';
import { useSavingStore } from '../stores/saving';
import MuseumCard from '../components/MuseumCard.vue';

const auth = useAuthStore();
const { currentUserId: userId } = storeToRefs(auth);
const saving = useSavingStore();

const loading = ref(false);
const error = ref<string | null>(null);
const items = ref<Array<{
  _key: string;
  owner: string;
  username: string | null;
  initial: string;
  museumId: string;
  museumName: string;
  createdAt: string;
  mapsUrl: string;
  photos: string[];
  exhibits: string[];
  exhibitsMoreCount: number;
  reviewStars: number | null;
  reviewNote: string | null;
}>>([]);

const selectedMuseumId = ref<string | null>(null);
function openMuseum(id: string) {
  selectedMuseumId.value = id;
  document.addEventListener('keydown', onEsc, { passive: true });
}
function closeModal() {
  selectedMuseumId.value = null;
  document.removeEventListener('keydown', onEsc as any);
}
function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal();
}

function isSaved(itemId: string): boolean {
  return userId.value ? saving.isSaved(userId.value, itemId) : false;
}
async function toggleSave(itemId: string) {
  if (!userId.value) return;
  try {
    if (saving.isSaved(userId.value, itemId)) {
      await saving.unsave(userId.value, itemId);
    } else {
      await saving.save(userId.value, itemId);
    }
  } catch (e: any) {
    alert(e?.message || 'Failed to update saved state');
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

function mapsUrlFor(museumId: string): string {
  const m = getMuseumById(museumId);
  if (!m) return '#';
  const parts = [m.address || m.name, m.borough, 'New York, NY', m.zip].filter(Boolean) as string[];
  const dest = encodeURIComponent(parts.join(', '));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

onMounted(async () => {
  if (!userId.value) return;
  loading.value = true;
  error.value = null;
  try {
    // 1) Find mutuals = intersection of followers and followees
    const [followers, followees] = await Promise.all([
      getFollowers(userId.value),
      getFollowees(userId.value),
    ]);
    const followerSet = new Set(followers);
    const mutuals = followees.filter((id) => followerSet.has(id));

    if (!mutuals.length) {
      items.value = [];
      return;
    }

    // 2) Fetch recent visits for each mutual (in parallel)
    const visitsByUser = await Promise.all(
      mutuals.map(async (uid) => {
        try {
          const v = await getVisitsByUser(uid);
          return v.map((vi) => ({ owner: uid, visit: vi }));
        } catch {
          return [] as Array<{ owner: string; visit: Visit }>;
        }
      })
    );
    let flat = visitsByUser.flat();

    // 3) Sort by recency (desc) and limit how many visits we enrich to keep it snappy
    flat.sort((a, b) => new Date(b.visit.createdAt).getTime() - new Date(a.visit.createdAt).getTime());
    flat = flat.slice(0, 40);

    // 4) Enrich usernames
    const usernameById = new Map<string, string | null>();
    await Promise.all(
      mutuals.map(async (uid) => {
        try {
          const name = await getUsernameByUserId(uid);
          usernameById.set(uid, name);
        } catch {
          usernameById.set(uid, null);
        }
      })
    );

    // 5) Load entries for each visit (photos, exhibits, notes)
    const entryLists = await Promise.all(
      flat.map(async ({ visit }) => {
        try {
          const entries = await getEntriesByVisit(visit._id);
          return { visitId: visit._id, entries };
        } catch {
          return { visitId: visit._id, entries: [] };
        }
      })
    );
    const photosByVisit = new Map<string, string[]>();
    const exhibitsByVisit = new Map<string, string[]>();
    const entryNotesByVisit = new Map<string, string[]>();
    for (const { visitId, entries } of entryLists) {
      const list = (entries || []) as VisitEntry[];
      const urls = list.map((e) => e.photoUrl).filter((u): u is string => !!u);
      photosByVisit.set(visitId, urls);
      const exIds = Array.from(new Set(list.map((e) => e.exhibit).filter(Boolean)));
      const museumId = flat.find((f) => f.visit._id === visitId)?.visit.museum || '';
      const exNames = exIds.map((exId) => exhibitName(museumId, exId));
      exhibitsByVisit.set(visitId, exNames);
      const entryNotes = list.map((e) => (e.note || '').trim()).filter(Boolean);
      entryNotesByVisit.set(visitId, entryNotes);
    }

    // 6) Load reviews once per mutual user and map by (user,item)
    const reviewsByUser = new Map<string, ReviewDTO[]>();
    await Promise.all(
      Array.from(new Set(flat.map((f) => f.owner))).map(async (uid) => {
        try {
          const reviews = await getReviewsByUser(uid);
          reviewsByUser.set(uid, reviews as ReviewDTO[]);
        } catch {
          reviewsByUser.set(uid, []);
        }
      })
    );
    const reviewMap = new Map<string, ReviewDTO>();
    for (const [uid, list] of reviewsByUser.entries()) {
      (list || []).forEach((r) => reviewMap.set(`${uid}:${r.item}`, r));
    }

    const enriched = flat
      .map(({ owner, visit }) => {
        const museumName = itemName(visit.museum);
        const username = usernameById.get(owner) ?? null;
        const photos = photosByVisit.get(visit._id) || [];
        const exhibitsAll = exhibitsByVisit.get(visit._id) || [];
        const exhibits = exhibitsAll.slice(0, 6);
        const exhibitsMoreCount = Math.max(0, exhibitsAll.length - exhibits.length);
        const rev = reviewMap.get(`${owner}:${visit.museum}`);
        const reviewStars = rev?.stars ?? null;
        const reviewNote = (rev?.note && rev.note.trim()) || (entryNotesByVisit.get(visit._id)?.[0] || null);
        return {
          _key: `${owner}:${visit._id}`,
          owner,
          username,
          initial: (username?.[0] || owner?.[0] || '?').toUpperCase(),
          museumId: visit.museum,
          museumName,
          createdAt: visit.createdAt,
          mapsUrl: mapsUrlFor(visit.museum),
          photos,
          exhibits,
          exhibitsMoreCount,
          reviewStars,
          reviewNote,
        };
      })
      .filter((x) => !!x.museumId);

    // 6) Cap final list size
    items.value = enriched.slice(0, 30);
  } catch (e: any) {
    error.value = e?.message || 'Failed to load feed';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.feed-page { max-width: 960px; margin: 0 auto; padding: 0 1rem; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.status { color: #666; }
.error { color: #b91c1c; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
.row { border: 1px solid #eee; border-radius: 10px; background: #fff; padding: 0.6rem 0.75rem; display: grid; grid-template-columns: 1fr auto; align-items: center; }
.row-main { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.who { display: inline-flex; align-items: center; gap: 0.4rem; }
.avatar { width: 28px; height: 28px; border-radius: 999px; background: #111827; color: #fff; display: grid; place-items: center; font-size: 0.9rem; }
.username { font-weight: 600; }
.activity { color: #374151; }
.museum { font-weight: 600; }
.row-right { display: inline-flex; align-items: center; gap: 0.5rem; color: #6b7280; }
.icon-link { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; background: #f3f4f6; text-decoration: none; }
.icon-link:hover { background: #e5e7eb; text-decoration: none; }

/* Horizontal photo gallery with scroll-snap for natural swiping */
.row-gallery { grid-column: 1 / -1; margin-top: 0.5rem; }
.gallery { display: flex; gap: 0.5rem; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding-bottom: 0.25rem; }
.photo { flex: 0 0 220px; height: 140px; border-radius: 10px; overflow: hidden; background: #f3f4f6; scroll-snap-align: start; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Exhibits chips and review */
.row-exhibits { grid-column: 1 / -1; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.row-exhibits .label { color: #6b7280; font-size: 0.85rem; }
.chips { list-style: none; padding: 0; margin: 0; display: inline-flex; gap: 0.375rem; flex-wrap: wrap; }
.chip { background: #f3f4f6; color: #374151; padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.85rem; }
.chip.more { background: #e5e7eb; color: #4b5563; }
.row-review { grid-column: 1 / -1; margin-top: 0.5rem; display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 0.5rem 0.75rem; }
.row-review .stars { color: #f5b301; white-space: nowrap; font-size: 1rem; }
.row-review .note { margin: 0; color: #111827; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: grid; place-items: center; z-index: 60; padding: 1rem; }
.modal { width: 100%; max-width: 560px; background: #fff; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: grid; grid-template-rows: auto 1fr; }
.modal-header { padding: 0.25rem 0.5rem; }
.modal-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.25rem; }
.modal-body { padding: 0 0.75rem 0.75rem; }
.close { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; }
.linklike { background: transparent; border: none; padding: 0; margin: 0; color: #0b72ef; cursor: pointer; text-decoration: underline; font: inherit; }
.bookmark-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; color: #444; border-radius: 6px; }
.bookmark-btn:hover { background: #f1f1f1; }
.bookmark-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
