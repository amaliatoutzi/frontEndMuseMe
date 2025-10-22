<template>
  <section class="spotlight-page container">
    <header class="page-header">
      <h2>Spotlight</h2>
    </header>

    <!-- Personalized recommendations based on your highly rated museums -->
    <section class="personal">
      <header class="subheader">
        <h3>For you</h3>
        <button class="primary" :disabled="recLoading || !canRefresh" @click="refreshFive">Refresh</button>
      </header>
      <p v-if="!isAuthed" class="muted">Sign in to see personalized similar museums based on your ratings.</p>
      <p v-if="recError" class="error">{{ recError }}</p>
      <div v-if="isAuthed && seeds.length" class="seeds">
        Because you liked:
        <span v-for="s in seeds" :key="s" class="seed">{{ s }}</span>
      </div>
      <ul v-if="isAuthed && recommendations.length" class="grid">
        <li v-for="id in recommendations" :key="id" class="card">
          <div v-if="museumOf(id)?.pictureUrl" class="media">
            <img :src="museumOf(id)?.pictureUrl" :alt="nameOf(id) + ' photo'" loading="lazy" />
          </div>
          <div v-else class="thumb" aria-hidden="true">🏛️</div>
          <div class="header-row">
            <div class="title">{{ nameOf(id) }}</div>
            <div class="actions">
              <a class="link icon-link" :href="mapsUrlById(id)" target="_blank" rel="noopener" aria-label="Directions" title="Directions">📍</a>
              <button
                class="bookmark-btn"
                :disabled="!isAuthed"
                @click="toggleSave(id)"
                :aria-pressed="isSaved(id) ? 'true' : 'false'"
                :title="!isAuthed ? 'Login to save' : (isSaved(id) ? 'Unsave' : 'Save')"
                aria-label="Bookmark"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  :fill="isSaved(id) ? 'currentColor' : 'none'"
                  :stroke="isSaved(id) ? 'none' : 'currentColor'"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M6 2h12a2 2 0 0 1 2 2v16l-8-4-8 4V4a2 2 0 0 1 2-2z" />
                </svg>
              </button>
            </div>
          </div>
          <div class="muted" v-if="museumOf(id)?.borough">{{ museumOf(id)?.borough }}</div>
          <div class="tags" v-if="museumOf(id)?.tags?.length">
            <span v-for="t in museumOf(id)?.tags || []" :key="t" class="tag">{{ formatTag(t) }}</span>
          </div>
          <div class="row">
            <a v-if="museumOf(id)?.website" class="link" :href="museumOf(id)?.website" target="_blank" rel="noopener">Website</a>
          </div>
        </li>
      </ul>
      <p v-else-if="isAuthed && triedPersonalized && !recommendations.length" class="muted">No recommendations yet. Rate a few museums highly, then try again.</p>
    </section>

    <!-- Manual controls removed per request; spotlight is now fully personalized -->
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { allMuseums, getMuseumById, itemName, Museum } from '../utils/catalog';
import { neighbors as apiNeighbors } from '../api/similarity';
import { getReviewsByUser, type ReviewDTO } from '../api/reviewing';
import { useAuthStore } from '../stores/auth';
import { storeToRefs } from 'pinia';
import { usePreferencesStore } from '../stores/preferences';
import { useSavingStore } from '../stores/saving';

const museums = allMuseums;

// Personalized state
const auth = useAuthStore();
const { currentUserId } = storeToRefs(auth);
const preferences = usePreferencesStore();
const isAuthed = ref(false);
const thresholds = [5, 4];
let neighborsPerSeed = 10; // start higher to improve coverage; will escalate if needed
const SHOW_COUNT = 6;
const recLoading = ref(false);
const recError = ref<string | null>(null);
const recommendations = ref<string[]>([]);
const triedPersonalized = ref(false);
const seeds = ref<string[]>([]);
const rankedPool = ref<string[]>([]);
const offset = ref(0);
const canRefresh = ref(false);

// Saving (bookmark) integration
const saving = useSavingStore();
function isSaved(id: string): boolean {
  return currentUserId.value ? saving.isSaved(currentUserId.value, id) : false;
}
async function toggleSave(id: string) {
  if (!currentUserId.value) return;
  try {
    if (saving.isSaved(currentUserId.value, id)) {
      await saving.unsave(currentUserId.value, id);
    } else {
      await saving.save(currentUserId.value, id);
    }
  } catch (e: any) {
    alert(e?.message || 'Failed to update saved state');
  }
}

function nameOf(id: string) {
  return itemName(id);
}
function museumOf(id: string): Museum | undefined {
  return getMuseumById(id);
}
function formatTag(tag: string): string {
  return tag.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function mapsUrlById(id: string): string {
  const m = museumOf(id);
  if (!m) return '#';
  const parts = [m.address || m.name, m.borough, 'New York, NY', m.zip].filter(Boolean);
  const dest = encodeURIComponent(parts.join(', '));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

async function loadPersonalized() {
  triedPersonalized.value = true;
  recommendations.value = [];
  recLoading.value = true;
  recError.value = null;
  seeds.value = [];
  try {
    const uid = currentUserId.value;
    if (!uid) {
      isAuthed.value = false;
      return;
    }
    isAuthed.value = true;
    // sync preferences so tag fallback is available
    try { await preferences.syncFromServer(uid); } catch {}
    const reviews: ReviewDTO[] = await getReviewsByUser(uid);
    // Filter valid museum reviews
    const valid = (reviews || []).filter((r) => r && typeof r === 'object' && r.item);
    const museumOnly = valid.filter((r) => !!getMuseumById(r.item));

    const reviewedSet = new Set(museumOnly.map((r) => r.item));
    // Build seeds from strong reviews (>=4), prioritize 5-star first
    let seedIds: string[] = [];
    for (const min of thresholds) {
      const liked = museumOnly.filter((r) => (r.stars || 0) >= min);
      seedIds = Array.from(new Set([...seedIds, ...liked.map((r) => r.item)]));
    }
    seeds.value = seedIds.map((id) => nameOf(id));

    // Neighbor candidates aggregated across seeds
    const freq = new Map<string, number>();
    if (seedIds.length) {
      for (const seed of seedIds) {
        try {
          const neigh = await apiNeighbors(seed, neighborsPerSeed);
          for (const n of neigh) {
            if (!getMuseumById(n)) continue; // museum-only
            if (seedIds.includes(n)) continue; // exclude seed itself
            freq.set(n, (freq.get(n) || 0) + 1);
          }
        } catch (_) { /* skip failed seed */ }
      }
    }
    const neighborRankedAll = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
    const neighborUnreviewed = neighborRankedAll.filter((id) => !reviewedSet.has(id));

    // Tag-driven candidates as signal and fallback
    const userTags: string[] = preferences.tagsForUser(uid) || [];
    const tagScored: Array<{ id: string; score: number }> = [];
    if (userTags.length) {
      for (const m of museums) {
        const mt = new Set(m.tags || []);
        let score = 0;
        for (const t of userTags) if (mt.has(t)) score++;
        if (score > 0) tagScored.push({ id: m.id, score });
      }
    }
    const tagRanked = tagScored
      .sort((a, b) => b.score - a.score || itemName(a.id).localeCompare(itemName(b.id)))
      .map((x) => x.id);

    // Compose final pool priority:
    // 1) neighbor unreviewed -> 2) tag unreviewed -> 3) neighbor reviewed -> 4) tag reviewed
    const pool: string[] = [];
    const pushIf = (id: string) => {
      if (!id) return;
      if (seedIds.includes(id)) return;
      if (!pool.includes(id)) pool.push(id);
    };
    for (const id of neighborUnreviewed) pushIf(id);
    for (const id of tagRanked) if (!reviewedSet.has(id)) pushIf(id);
    if (pool.length < SHOW_COUNT) {
      for (const id of neighborRankedAll) if (reviewedSet.has(id)) pushIf(id);
    }
    if (pool.length < SHOW_COUNT) {
      for (const id of tagRanked) if (reviewedSet.has(id)) pushIf(id);
    }

    rankedPool.value = pool;
    offset.value = 0;
    applySlice();
    canRefresh.value = rankedPool.value.length > SHOW_COUNT;
  } catch (e: any) {
    recError.value = e?.message || 'Failed to generate recommendations';
  } finally {
    recLoading.value = false;
  }
}

function applySlice() {
  if (!rankedPool.value.length) {
    recommendations.value = [];
    return;
  }
  const pool = rankedPool.value;
  const out: string[] = [];
  for (let i = 0; i < SHOW_COUNT && i < pool.length; i++) {
    out.push(pool[(offset.value + i) % pool.length]);
  }
  recommendations.value = out;
}

function refreshFive() {
  if (!rankedPool.value.length) {
    // Try to regenerate
    void loadPersonalized();
    return;
  }
  if (rankedPool.value.length <= SHOW_COUNT) {
    applySlice();
    canRefresh.value = false;
    return;
  }
  offset.value = (offset.value + SHOW_COUNT) % rankedPool.value.length;
  applySlice();
}

// Initialize auth flag for template logic
isAuthed.value = !!currentUserId.value;
onMounted(async () => {
  if (isAuthed.value) {
    await loadPersonalized();
  }
});
</script>

<style scoped>
.container { max-width: 960px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.primary { background: var(--brand-600); border: 1px solid var(--brand-600); color: #fff; padding: 0.45rem 0.8rem; border-radius: 8px; }
.primary:hover { background: #000; border-color: #000; color: #fff; }
.subheader { display: flex; align-items: center; justify-content: space-between; }
.mini-controls { display: inline-flex; gap: 0.5rem; align-items: end; }
.personal { display: grid; gap: 0.5rem; margin-bottom: 1rem; }
.field { display: grid; gap: 0.25rem; }
.field select, .field input { padding: 0.45rem 0.6rem; border: 1px solid #ddd; border-radius: 8px; }
.field.mini select, .field.mini input { padding: 0.35rem 0.5rem; }
.error { color: #b91c1c; }
.grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.card { border: 1px solid #eee; border-radius: 10px; padding: 0.75rem; background: #fff; display: grid; gap: 0.25rem; }
.media { margin: -0.75rem -0.75rem 0.5rem; height: 160px; overflow: hidden; border-top-left-radius: 10px; border-top-right-radius: 10px; background: #f3f4f6; }
.media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb { width: 48px; height: 48px; display: grid; place-items: center; background: #f3f4f6; border-radius: 8px; font-size: 1.25rem; }
.header-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.actions { display: inline-flex; align-items: center; gap: 0.35rem; }
.title { font-weight: 600; }
.muted { color: #6b7280; }
.tags { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.tag { font-size: 0.75rem; padding: 0.1rem 0.4rem; border: 1px solid #eee; border-radius: 999px; color: #444; }
.row { margin-top: 0.5rem; display: flex; justify-content: flex-end; }
.link { color: #0b72ef; text-decoration: none; }
.link:hover { text-decoration: underline; }
.link + .link { margin-left: 0.5rem; }
.icon-link { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; background: #f3f4f6; text-decoration: none; }
.icon-link:hover { background: #e5e7eb; text-decoration: none; }
.bookmark-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; background: transparent; color: #444; border-radius: 6px; }
.bookmark-btn:hover { background: #f1f1f1; }
.bookmark-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.seeds { color: #444; display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap; }
.seed { background: #f5f5f5; border: 1px solid #eee; border-radius: 999px; padding: 0.1rem 0.5rem; }
</style>
