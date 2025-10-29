<template>
  <section class="feed-page">
    <header class="page-header">
      <h2 id="feed-title">Friends feed</h2>
    </header>
    <GoldDivider class="divider-tight" :height="32" :stroke="18" :ornament-stroke="16" match-to="#feed-title" />

    <div v-if="!userId" class="banner info">Login to see your feed.</div>
    <div v-else>
      <div v-if="loading" class="status">Loading…</div>
      <p v-else-if="error" class="banner info">{{ error }}</p>
      <p v-else-if="items.length === 0" class="banner empty">No recent activity from mutuals yet.</p>

      <ul v-else class="list">
        <li v-for="it in items" :key="it._key" class="row">
          <div class="row-main">
            <div class="who">
              <Avatar :first-name="it.firstName" :last-name="it.lastName" :username="it.username || it.owner" :url="it.avatarUrl || null" :size="28" />
              <strong class="username">{{ it.username || it.owner }}</strong>
            </div>
            <div class="activity">
              visited <button class="museum linklike" @click="openMuseum(it.museumId)">{{ it.museumName }}</button>
            </div>
          </div>
          <div class="row-right">
            <time :datetime="it.createdAt">{{ formatDate(it.createdAt) }}</time>
            <a class="dir icon-link" :href="it.mapsUrl" target="_blank" rel="noopener" aria-label="Directions" title="Directions">
              <Icon name="map-pin" :size="18" :stroke="2" />
            </a>
          </div>
          <div v-if="it.photos?.length" class="row-gallery">
            <div class="gallery-wrap">
              <button v-if="needsCarousel(it.photos)" class="nav prev" @click="prev(it._key, it.photos.length)" aria-label="Previous photo">‹</button>
              <div
                :class="['gallery', needsCarousel(it.photos) ? 'smooth-scroll' : 'static']"
                aria-label="Visit photos"
                tabindex="0"
                :ref="setGalleryRef(it._key)"
                @scroll.passive="onGalleryScroll(it._key)"
              >
                <div v-for="(p, idx) in it.photos" :key="idx" class="photo">
                  <img :src="p" alt="Visit photo" loading="lazy" class="fade-in-img" @load="onImgLoad" @click="openLightbox(it.photos, idx)" />
                </div>
              </div>
              <button v-if="needsCarousel(it.photos)" class="nav next" @click="next(it._key, it.photos.length)" aria-label="Next photo">›</button>
            </div>
            <div v-if="needsCarousel(it.photos)" class="dots" role="tablist" aria-label="Photo pagination">
              <button
                v-for="(p, i) in it.photos"
                :key="i"
                class="dot"
                :class="{ active: currentIndex(it._key) === i }"
                :aria-selected="currentIndex(it._key) === i ? 'true' : 'false'"
                @click="goTo(it._key, i)"
              />
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
      <Transition name="overlay-fade">
        <div v-if="selectedMuseumId" class="modal-overlay" role="dialog" aria-modal="true" @click.self="closeModal">
          <Transition name="modal-pop">
            <div class="modal">
              <header class="modal-header">
            <div class="modal-actions">
              <button
                class="bookmark-btn"
                :class="{ bookmarked: selectedMuseumId && isSaved(selectedMuseumId) }"
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
          </Transition>
        </div>
      </Transition>

      <!-- Photo lightbox -->
      <Transition name="overlay-fade">
        <div
          v-if="lightbox"
          class="lb-overlay"
          role="dialog"
          aria-label="Photo viewer"
          aria-modal="true"
          @click.self="closeLightbox"
        >
          <button v-if="lightbox.photos.length > 1" class="lb-nav prev" @click="lbPrev" aria-label="Previous photo">‹</button>
          <img :src="lightbox.photos[lightbox.index]" alt="Expanded visit photo" class="lb-img" />
          <button v-if="lightbox.photos.length > 1" class="lb-nav next" @click="lbNext" aria-label="Next photo">›</button>
          <button class="lb-close" @click="closeLightbox" aria-label="Close">✕</button>
        </div>
      </Transition>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed, type ComponentPublicInstance } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { getFollowers, getFollowees } from '../api/following';
import { getUsernameByUserId } from '../api/users';
import { getVisitsByUser, getEntriesByVisit, type Visit, type VisitEntry } from '../api/visit';
import { getReviewsByUser, type ReviewDTO } from '../api/reviewing';
import { getMuseumById, itemName, exhibitName } from '../utils/catalog';
import { useSavingStore } from '../stores/saving';
import MuseumCard from '../components/MuseumCard.vue';
import Avatar from '../components/profile/Avatar.vue';
import { getProfile, type Profile } from '../api/profile';
import Icon from '../components/ui/Icon.vue';
import GoldDivider from '../components/ui/GoldDivider.vue';

const auth = useAuthStore();
const { currentUserId: userId } = storeToRefs(auth);
const saving = useSavingStore();

const loading = ref(false);
const error = ref<string | null>(null);
const items = ref<Array<{
  _key: string;
  owner: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
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

function onImgLoad(e: Event) {
  const img = e.target as HTMLImageElement;
  if (!img) return;
  img.classList.add('is-loaded');
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

    // 4b) Fetch profiles for avatar and names
    const profileById = new Map<string, Profile | null>();
    await Promise.all(
      mutuals.map(async (uid) => {
        try {
          const p = await getProfile(uid);
          profileById.set(uid, p);
        } catch {
          profileById.set(uid, null);
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
      const urls: string[] = [];
      const push = (v: any) => { if (typeof v === 'string' && v.trim()) urls.push(v.trim()); };
      for (const e of list) {
        if (e?.photoUrl) push(e.photoUrl);
        if (Array.isArray(e?.photoUrls)) e.photoUrls.forEach(push);
        if ((e as any)?.photos) {
          const arr = (e as any).photos;
          if (Array.isArray(arr)) arr.forEach(push);
        }
        if ((e as any)?.photo) push((e as any).photo);
      }
  // dedupe, keep order
  const deduped = Array.from(new Set(urls));
  photosByVisit.set(visitId, deduped);
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
        const prof = profileById.get(owner) || null;
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
          firstName: prof?.firstName || null,
          lastName: prof?.lastName || null,
          avatarUrl: prof?.profilePictureUrl || null,
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

// Simple carousel state and helpers per row
const galleries = reactive<Record<string, HTMLElement | null>>({});
const indices = reactive<Record<string, number>>({});
function setGalleryRef(key: string) {
  return (el: Element | ComponentPublicInstance | null) => {
    galleries[key] = (el as unknown as HTMLElement) || null;
  };
}
function currentIndex(key: string): number { return indices[key] ?? 0; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function goTo(key: string, idx: number) {
  const el = galleries[key]; if (!el) return;
  const i = clamp(idx, 0, el.children.length - 1);
  const child = el.children[i] as HTMLElement | undefined;
  if (child) el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
  indices[key] = i;
}
function step(key: string, total: number, dir: number) {
  const next = clamp(currentIndex(key) + dir, 0, Math.max(0, total - 1));
  goTo(key, next);
}
function prev(key: string, total: number) { step(key, total, -1); }
function next(key: string, total: number) { step(key, total, +1); }
let rafId: number | null = null;
function onGalleryScroll(key: string) {
  if (rafId != null && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    const el = galleries[key]; if (!el || el.classList.contains('static')) return;
    const children = Array.from(el.children) as HTMLElement[];
    if (!children.length) return;
    // Find the child whose left edge is closest to scrollLeft
    const sl = el.scrollLeft;
    let bestI = 0; let bestD = Infinity;
    children.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - sl);
      if (d < bestD) { bestD = d; bestI = i; }
    });
    indices[key] = bestI;
  });
}

// Only enable carousel behavior if there are more than 3 photos
function needsCarousel(photos: string[] | null | undefined): boolean {
  return Array.isArray(photos) && photos.length > 3;
}

// -------- Lightbox state and actions --------
const lightbox = ref<{ photos: string[]; index: number } | null>(null);
function openLightbox(photos: string[], index: number) {
  if (!Array.isArray(photos) || photos.length === 0) return;
  lightbox.value = { photos, index: Math.max(0, Math.min(index, photos.length - 1)) };
  document.addEventListener('keydown', onLightboxEsc, { passive: true });
}
function closeLightbox() {
  lightbox.value = null;
  document.removeEventListener('keydown', onLightboxEsc as any);
}
function onLightboxEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowRight') lbNext();
  else if (e.key === 'ArrowLeft') lbPrev();
}
function lbNext() {
  if (!lightbox.value) return;
  const { photos, index } = lightbox.value;
  lightbox.value = { photos, index: Math.min(index + 1, photos.length - 1) };
}
function lbPrev() {
  if (!lightbox.value) return;
  const { photos, index } = lightbox.value;
  lightbox.value = { photos, index: Math.max(index - 1, 0) };
}
</script>

<style scoped>
.feed-page { max-width: 960px; margin: 0 auto; padding: 0 1rem; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.15rem; }
.page-header h2 { margin: 0; }
.status { color: var(--muted); }
.error { color: #b91c1c; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
.row { border: 1px solid var(--border); border-radius: 10px; background: #fff; padding: 0.6rem 0.75rem; display: grid; grid-template-columns: 1fr auto; align-items: center; }
.row-main { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.who { display: inline-flex; align-items: center; gap: 0.4rem; }
.avatar { width: 28px; height: 28px; border-radius: 999px; background: #111827; color: #fff; display: grid; place-items: center; font-size: 0.9rem; }
.username { font-weight: 600; }
.activity { color: #374151; }
.museum { font-weight: 600; }
.row-right { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--muted); }
/* Use global .icon-link styles for consistent hover contrast */
.divider-tight { margin-top: -0.3rem; margin-bottom: 0.15rem; }

/* Horizontal photo gallery with scroll-snap for natural swiping */
.row-gallery { grid-column: 1 / -1; margin-top: 0.5rem; }
.gallery-wrap { position: relative; }
.gallery { display: flex; gap: 0.5rem; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding-bottom: 0.25rem; }
.gallery.static { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; overflow: visible; scroll-snap-type: none; }
.photo { flex: 0 0 220px; height: 140px; border-radius: 10px; overflow: hidden; background: #f3f4f6; scroll-snap-align: start; }
.gallery.static .photo { flex: initial; width: 100%; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo img { cursor: zoom-in; }
.nav { position: absolute; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border-radius: 999px; border: none; background: rgba(0,0,0,0.5); color: #fff; display: grid; place-items: center; cursor: pointer; z-index: 2; }
.nav.prev { left: 6px; }
.nav.next { right: 6px; }
.dots { display: flex; gap: 6px; justify-content: center; margin-top: 6px; }
.dot { width: 6px; height: 6px; border-radius: 999px; background: #d1d5db; border: none; }
.dot.active { background: #111827; }

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
.close:hover { color: var(--accent-gold); }
.linklike { background: transparent; border: none; padding: 0; margin: 0; color: var(--brand-600); cursor: pointer; text-decoration: underline; font: inherit; }
.linklike:hover { color: var(--brand-700); }
.bookmark-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; color: var(--brand-600); border-radius: 6px; }
.bookmark-btn:hover { background: #f1f1f1; }
.bookmark-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Lightbox */
.lb-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: grid; place-items: center; z-index: 70; }
.lb-img { max-width: 90vw; max-height: 85vh; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
.lb-close { position: fixed; top: 14px; right: 16px; background: transparent; border: none; color: #fff; font-size: 1.4rem; cursor: pointer; }
.lb-close:hover { color: var(--accent-gold); }
.lb-nav { position: fixed; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 999px; border: none; background: rgba(0,0,0,0.5); color: #fff; display: grid; place-items: center; cursor: pointer; }
.lb-nav.prev { left: 16px; }
.lb-nav.next { right: 16px; }
.lb-nav:hover { background: rgba(0,0,0,0.65); }
</style>
