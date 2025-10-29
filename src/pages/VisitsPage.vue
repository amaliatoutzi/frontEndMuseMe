<template>
  <div class="container visits-page">
    <!-- When not creating, show list view -->
    <section v-if="!showForm" class="list-view">
      <header class="page-header">
        <h2 id="showcase-title">Showcase</h2>
        <div class="page-actions">
          <button class="primary" @click="showForm = true">Add Visit</button>
        </div>
      </header>
  <GoldDivider class="divider-tight" :height="32" :stroke="18" :ornament-stroke="16" match-to="#showcase-title" />
      <section v-if="currentUserId" class="stats">
        <div class="stat">
          <div class="stat-icon"><Icon name="sculpture" :size="24" /></div>
          <div class="stat-value">{{ exhibitsCount }}</div>
          <div class="stat-label">Exhibits</div>
        </div>
        <div class="stat">
          <div class="stat-icon"><Icon name="museum" :size="24" /></div>
          <div class="stat-value">{{ museumsCount }}</div>
          <div class="stat-label">Museums</div>
        </div>
        <div class="stat">
          <div class="stat-icon"><Icon name="star" :size="24" /></div>
          <div class="stat-value">{{ avgMuseumRating != null ? avgMuseumRating.toFixed(1) : '—' }}</div>
          <div class="stat-label">Avg Rating</div>
        </div>
      </section>
  <VisitsList v-if="currentUserId" :user-id="currentUserId" :show-create="false" :allow-add-entries="false" />
  <p v-else class="banner info">You need to sign in to view your showcase.</p>
    </section>

    <!-- Create visit form view -->
    <section v-else class="form-view">
      <header class="page-header">
        <h2 id="write-title">Write Review</h2>
        <div class="header-actions">
          <button class="ghost" @click="cancel">Cancel</button>
          <button class="submit" :disabled="!canSubmit || submitting" @click="onSubmit">
            {{ submitting ? 'Submitting…' : 'Submit' }}
          </button>
        </div>
      </header>
      <GoldDivider :height="24" :stroke="4" :ornament-stroke="3" match-to="#write-title" />

      <!-- Museum selector and summary card -->
      <section class="museum-card">
        <label class="museum-select">
          <span>Museum</span>
          <div class="combo">
            <input
              v-model="museumQuery"
              :disabled="submitting"
              placeholder="Start typing a museum name…"
              @focus="showSuggestions = true"
              @keydown.enter.prevent="onMuseumEnter"
            />
            <button
              v-if="museumId"
              type="button"
              class="clear"
              :disabled="submitting"
              @click="clearMuseum"
            >Change</button>
            <ul v-if="!museumId && showSuggestions" class="suggestions">
              <li
                v-for="m in filteredMuseums"
                :key="m.id"
                class="suggestion"
                @mousedown.prevent="selectMuseum(m)"
              >
                <span class="sg-name">{{ m.name }}</span>
                <span class="sg-sub muted">{{ m.borough || 'New York, NY' }}</span>
              </li>
              <li v-if="!filteredMuseums.length" class="suggestion empty muted">No matches</li>
            </ul>
          </div>
        </label>

        <div v-if="museum" class="museum-info">
          <div class="thumb" aria-hidden="true"><Icon name="museum" :size="22" /></div>
          <div>
            <div class="name">{{ museum.name }}</div>
            <div class="muted">{{ museum.borough || 'New York, NY' }}</div>
          </div>
        </div>

        <div v-if="museum" class="overall">
          <div class="row">
            <label>Overall Rating</label>
            <StarRating v-model="overallRating" aria-label="Overall rating" />
          </div>
          <div class="row">
            <label>Your Review</label>
            <textarea v-model="overallNote" placeholder="Share your experience at this museum..."></textarea>
            <div class="actions">
              <button type="button" class="ghost" @click="preview = !preview">{{ preview ? 'Edit' : 'Preview' }}</button>
            </div>
            <div v-if="preview" class="preview">{{ overallNote }}</div>
          </div>
        </div>
      </section>

      <!-- Exhibit selection -->
      <section v-if="museum" class="exhibit-pick">
        <h3>Select Exhibits You Visited</h3>
        <ul class="exhibit-list">
          <li v-for="ex in exhibits" :key="ex.id" class="ex-row">
            <label class="ex-label">
              <input type="checkbox" :value="ex.id" v-model="selectedExhibits" />
              <div class="ex-text">
                <div class="ex-name">{{ ex.name }}</div>
                <div class="ex-sub muted" v-if="ex.gallery || ex.type">{{ [ex.gallery, ex.type].filter(Boolean).join(' • ') }}</div>
              </div>
            </label>
          </li>
        </ul>
      </section>

      <!-- Per exhibit reviews -->
      <section v-if="museum && selectedExhibits.length" class="exhibit-reviews">
        <h3>Review Your Exhibits</h3>
        <div class="cards">
          <article v-for="exId in selectedExhibits" :key="exId" class="ex-card">
            <header class="ex-head">{{ exName(exId) }}</header>
            <div class="field">
              <label>Rating</label>
              <StarRating v-model="perExhibitRating[exId]" aria-label="Exhibit rating" />
            </div>
            <div class="field">
              <label>Your thoughts</label>
              <textarea v-model="perExhibitNote[exId]" :placeholder="`What did you think of ${exName(exId)}?`"></textarea>
            </div>
            <div class="field">
              <label>Photos</label>
              <label class="upload">
                <span class="upload-label"><Icon name="camera" :size="16" /> <span>Add Photos</span></span>
                <input type="file" accept="image/*" multiple @change="onPickPhoto(exId, $event)" />
              </label>
              <ul v-if="perExhibitPhotoUrls[exId]?.length" class="thumbs-grid">
                <li v-for="(url, i) in perExhibitPhotoUrls[exId]" :key="i" class="thumb-item">
                  <img :src="url" alt="Preview" />
                  <button type="button" class="remove" @click="removePhoto(exId, i)" title="Remove">✕</button>
                </li>
              </ul>
              <ul v-if="perExhibitPhotos[exId]?.length" class="thumbs">
                <li v-for="(f, i) in perExhibitPhotos[exId]" :key="i">{{ f.name }}</li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      <!-- Bottom submit bar -->
      <footer class="bottom-bar">
        <button class="ghost" @click="cancel">Cancel</button>
        <button class="submit" :disabled="!canSubmit || submitting" @click="onSubmit">
          {{ submitting ? 'Submitting…' : 'Submit' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import StarRating from '../components/common/StarRating.vue';
import Icon from '../components/ui/Icon.vue';
import GoldDivider from '../components/ui/GoldDivider.vue';
import { allMuseums, getMuseumById, listExhibits, exhibitName, type Exhibit } from '../utils/catalog';
import { useAuthStore } from '../stores/auth';
import { useVisitsStore } from '../stores/visits';
import VisitsList from '../components/profile/VisitsPanel.vue';
import { getReviewsByUser, upsertReview, type ReviewDTO } from '../api/reviewing';

const museums = allMuseums;
const showForm = ref(false);
const museumId = ref('');
const museumQuery = ref('');
const showSuggestions = ref(false);
const filteredMuseums = computed(() => {
  const q = museumQuery.value.trim().toLowerCase();
  const list = museums;
  if (!q) return list.slice(0, 10);
  return list
    .filter((m) => m.name.toLowerCase().includes(q) || (m.borough || '').toLowerCase().includes(q))
    .slice(0, 10);
});
const museum = computed(() => getMuseumById(museumId.value));
const exhibits = computed<Exhibit[]>(() => (museumId.value ? listExhibits(museumId.value) : []));
const selectedExhibits = ref<string[]>([]);

const overallRating = ref(0);
const overallNote = ref('');
const preview = ref(false);

// Per-exhibit state
const perExhibitRating = reactive<Record<string, number>>({});
const perExhibitNote = reactive<Record<string, string>>({});
const perExhibitPhotos = reactive<Record<string, File[]>>({});
const perExhibitPhotoUrls = reactive<Record<string, string[]>>({});

watch(selectedExhibits, (arr) => {
  // Initialize missing keys, and cleanup deselected
  const set = new Set(arr);
  for (const id of arr) {
    if (!(id in perExhibitRating)) perExhibitRating[id] = 0;
    if (!(id in perExhibitNote)) perExhibitNote[id] = '';
    if (!(id in perExhibitPhotos)) perExhibitPhotos[id] = [];
  }
  for (const key of Object.keys(perExhibitRating)) if (!set.has(key)) delete perExhibitRating[key];
  for (const key of Object.keys(perExhibitNote)) if (!set.has(key)) delete perExhibitNote[key];
  for (const key of Object.keys(perExhibitPhotos)) if (!set.has(key)) delete perExhibitPhotos[key];
  for (const key of Object.keys(perExhibitPhotoUrls)) if (!set.has(key)) delete perExhibitPhotoUrls[key];
});

const auth = useAuthStore();
const { currentUserId } = storeToRefs(auth);
const visits = useVisitsStore();

// Stats: exhibits count, museums count, average rating (museums only)
const exhibitsCount = computed(() => {
  if (!currentUserId.value) return 0;
  const vs = visits.visitsForUser(currentUserId.value);
  let total = 0;
  for (const v of vs) {
    total += visits.entriesForVisit(v._id).length;
  }
  return total;
});

const museumsCount = computed(() => {
  if (!currentUserId.value) return 0;
  const vs = visits.visitsForUser(currentUserId.value);
  const set = new Set<string>();
  vs.forEach((v) => set.add(v.museum));
  return set.size;
});

const avgMuseumRating = ref<number | null>(null);

async function loadAvgRating(userId: string) {
  try {
    const reviews: ReviewDTO[] = await getReviewsByUser(userId);
    console.log('[Showcase] All reviews:', reviews);
    // Filter out nulls/undefined and ensure we have valid review objects
    const validReviews = reviews.filter((r) => r && typeof r === 'object' && r.item);
    console.log('[Showcase] Valid reviews:', validReviews);
    const museumOnly = validReviews.filter((r) => {
      const isMuseum = !!getMuseumById(r.item);
      console.log(`[Showcase] Review item ${r.item}: isMuseum=${isMuseum}, stars=${r.stars}`);
      return isMuseum;
    });
    console.log('[Showcase] Museum-only reviews:', museumOnly);
    if (!museumOnly.length) {
      console.log('[Showcase] No museum reviews found');
      avgMuseumRating.value = null;
      return;
    }
    const sum = museumOnly.reduce((acc, r) => acc + (r.stars || 0), 0);
    avgMuseumRating.value = sum / museumOnly.length;
    console.log('[Showcase] Avg rating:', avgMuseumRating.value);
  } catch (e) {
    console.error('[Showcase] Error loading avg rating:', e);
    avgMuseumRating.value = null;
  }
}

// Ensure stats have data: sync visits and entries, then load ratings
onMounted(async () => {
  const uid = currentUserId.value;
  if (!uid) return;
  await visits.syncVisits(uid);
  const vs = visits.visitsForUser(uid);
  await Promise.all(vs.map((v) => visits.syncEntries(v._id)));
  await loadAvgRating(uid);
});

watch(currentUserId, async (uid) => {
  if (!uid) { avgMuseumRating.value = null; return; }
  await visits.syncVisits(uid);
  const vs = visits.visitsForUser(uid);
  await Promise.all(vs.map((v) => visits.syncEntries(v._id)));
  await loadAvgRating(uid);
});

const canSubmit = computed(() => !!currentUserId.value && !!museumId.value && selectedExhibits.value.length > 0);
const submitting = ref(false);

function exName(id: string) { return museumId.value ? exhibitName(museumId.value, id) : id; }

function onPickPhoto(exId: string, e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files ? Array.from(input.files) : [];
  perExhibitPhotos[exId] = files;
  perExhibitPhotoUrls[exId] = [];
  const toRead = files.slice(0, 9); // cap to 9 per exhibit for UI sanity
  toRead.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : '';
      if (url) perExhibitPhotoUrls[exId].push(url);
    };
    reader.readAsDataURL(file);
  });
}

async function onSubmit() {
  if (!canSubmit.value || !currentUserId.value) return;
  submitting.value = true;
  try {
    // If the user provided an overall rating for the museum, persist it as a museum review
    if (overallRating.value > 0) {
      console.log('[Showcase] Upserting museum review:', {
        user: currentUserId.value,
        museum: museumId.value,
        stars: overallRating.value,
        note: overallNote.value
      });
      await upsertReview(currentUserId.value, museumId.value, overallRating.value, overallNote.value || undefined);
      console.log('[Showcase] Museum review upserted successfully');
    }
    const visitId = await visits.create(currentUserId.value, museumId.value);
    // Add entries for each selected exhibit
    for (const exId of selectedExhibits.value) {
      const rating = perExhibitRating[exId] || undefined;
      const note = perExhibitNote[exId] || undefined;
      const photos = perExhibitPhotoUrls[exId] && perExhibitPhotoUrls[exId].length ? perExhibitPhotoUrls[exId] : undefined;
      await visits.addEntry(visitId, exId, currentUserId.value, note, photos, rating);
    }
    // Ensure entries are synced for the new visit before returning to list
    await visits.syncEntries(visitId);
    // Reset state after submit
    museumId.value = '';
    selectedExhibits.value = [];
    overallRating.value = 0;
    overallNote.value = '';
    for (const k of Object.keys(perExhibitRating)) delete perExhibitRating[k];
    for (const k of Object.keys(perExhibitNote)) delete perExhibitNote[k];
    for (const k of Object.keys(perExhibitPhotos)) delete perExhibitPhotos[k];
  for (const k of Object.keys(perExhibitPhotoUrls)) delete perExhibitPhotoUrls[k];
    // Refresh list and switch back to list view
    await visits.syncVisits(currentUserId.value);
    showForm.value = false;
    // Refresh stats (average rating) after submitting
    await loadAvgRating(currentUserId.value);
    alert('Visit submitted');
  } catch (e: any) {
    alert(e?.message || 'Failed to submit visit');
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  showForm.value = false;
}

// Autocomplete interactions
function selectMuseum(m: { id: string; name: string }) {
  museumId.value = m.id;
  museumQuery.value = m.name;
  showSuggestions.value = false;
}
function onMuseumEnter() {
  if (museumId.value) return; // already selected
  const first = filteredMuseums.value[0];
  if (first) selectMuseum(first);
}
function clearMuseum() {
  museumId.value = '';
  museumQuery.value = '';
  showSuggestions.value = true;
  // Reset exhibit selections and related state
  selectedExhibits.value = [];
  for (const k of Object.keys(perExhibitRating)) delete perExhibitRating[k];
  for (const k of Object.keys(perExhibitNote)) delete perExhibitNote[k];
  for (const k of Object.keys(perExhibitPhotos)) delete perExhibitPhotos[k];
  for (const k of Object.keys(perExhibitPhotoUrls)) delete perExhibitPhotoUrls[k];
}

// If museum changes (e.g., by typing then selecting), reset exhibits
watch(museumId, (newId, oldId) => {
  if (newId !== oldId) {
    selectedExhibits.value = [];
    for (const k of Object.keys(perExhibitRating)) delete perExhibitRating[k];
    for (const k of Object.keys(perExhibitNote)) delete perExhibitNote[k];
    for (const k of Object.keys(perExhibitPhotos)) delete perExhibitPhotos[k];
    for (const k of Object.keys(perExhibitPhotoUrls)) delete perExhibitPhotoUrls[k];
  }
});

function removePhoto(exId: string, index: number) {
  const urls = perExhibitPhotoUrls[exId] || [];
  if (index < 0 || index >= urls.length) return;
  urls.splice(index, 1);
  // Try to keep files array in sync when lengths match
  const files = perExhibitPhotos[exId] || [];
  if (files.length === urls.length + 1) {
    files.splice(index, 1);
  }
  // Trigger reactivity for arrays
  perExhibitPhotoUrls[exId] = [...urls];
  if (files.length) perExhibitPhotos[exId] = [...files];
}

// no dev-only cleanup controls
</script>

<style scoped>
.visits-page { display: grid; gap: 1rem; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.15rem; }
.page-header h2 { margin: 0; }
.page-actions { display: inline-flex; gap: 0.5rem; }
.primary { padding: 0.45rem 0.85rem; border: 1px solid var(--brand-600); background: var(--brand-600); color: #fff; border-radius: 8px; }
.primary:hover { background: #000; border-color: #000; color: #fff; }
.header-actions { display: flex; gap: 0.5rem; align-items: center; }
.submit { padding: 0.45rem 0.85rem; border: 1px solid #ddd; background: #f5f5f5; border-radius: 8px; transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard); }
.submit:not(:disabled):hover { background: var(--accent-gold); border-color: var(--accent-gold); color: #fff; }
.submit:disabled { opacity: 0.6; cursor: not-allowed; }

.museum-card { border: 1px solid #eee; border-radius: 10px; padding: 1rem; display: grid; gap: 0.75rem; background: #fff; }
.museum-select { display: grid; gap: 0.25rem; position: relative; }
.combo { position: relative; }
.combo input { width: 100%; padding: 0.45rem 0.6rem; border: 1px solid #ddd; border-radius: 8px; }
.combo .clear { position: absolute; right: 4px; top: 4px; bottom: 4px; margin: auto; height: 28px; padding: 0 0.5rem; border: 1px solid #ddd; background: #f9fafb; border-radius: 6px; }
.suggestions { position: absolute; z-index: 20; width: 100%; background: #fff; border: 1px solid #eee; border-radius: 8px; margin-top: 0.35rem; box-shadow: 0 8px 24px rgba(0,0,0,0.08); max-height: 280px; overflow: auto; padding: 0.25rem; list-style: none; }
.suggestion { display: flex; justify-content: space-between; gap: 0.5rem; padding: 0.5rem 0.6rem; border-radius: 6px; cursor: pointer; }
.suggestion:hover { background: #f9fafb; }
.suggestion.empty { cursor: default; }
.sg-name { font-weight: 500; }
.sg-sub { font-size: 0.9rem; }
.museum-info { display: flex; gap: 0.75rem; align-items: center; }
.museum-info .thumb { width: 48px; height: 48px; display: grid; place-items: center; background: #f3f4f6; border-radius: 8px; font-size: 1.25rem; }
.museum-info .name { font-weight: 600; }
.muted { color: #6b7280; }
.overall .row { display: grid; gap: 0.35rem; margin-top: 0.5rem; }
.overall textarea { min-height: 90px; padding: 0.6rem; border: 1px solid #ddd; border-radius: 8px; resize: vertical; }
.actions { margin-top: 0.35rem; }
.ghost { background: #fafafa; border: 1px solid #ddd; padding: 0.35rem 0.6rem; border-radius: 6px; transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard); }
.ghost:hover { background: var(--accent-gold); border-color: var(--accent-gold); color: #fff; }
.preview { white-space: pre-wrap; background: #f9fafb; border: 1px dashed #e5e7eb; padding: 0.5rem; border-radius: 6px; }

/* Stats header */
.stats { display: grid; grid-auto-flow: column; gap: 1.5rem; margin: 0.75rem auto 0.5rem; max-width: 800px; justify-content: center; }
.stat { background: rgba(45,95,93,0.06); border: 1px solid rgba(45,95,93,0.25); border-radius: 16px; padding: 1.75rem 1.5rem; display: grid; place-items: center; min-width: 200px; position: relative; overflow: hidden; }
.stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #7A5A00 0%, #D7AE2B 28%, #FFE9A9 52%, #D7AE2B 75%, #6E5100 100%); border-top-left-radius: 16px; border-top-right-radius: 16px; }
.stat-icon { font-size: 2rem; margin-bottom: 0.5rem; color: var(--teal); }
.stat-value { font-weight: 700; font-size: 2.5rem; line-height: 1; color: var(--teal); }
.stat-label { color: #6b7280; margin-top: 0.5rem; font-size: 1.15rem; }

.exhibit-pick { border: 1px solid #eee; border-radius: 10px; padding: 1rem; display: grid; gap: 0.5rem; background: #fff; }
.exhibit-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.35rem; }
.ex-row { border: 1px solid #f0f0f0; border-radius: 8px; padding: 0.5rem 0.6rem; }
.ex-label { display: flex; gap: 0.6rem; align-items: center; }
.ex-text { display: grid; line-height: 1.2; }
.ex-name { font-weight: 600; }

.exhibit-reviews { display: grid; gap: 0.75rem; }
.cards { display: grid; gap: 0.75rem; }
.ex-card { border: 1px solid #eee; border-radius: 10px; padding: 1rem; background: #fff; display: grid; gap: 0.5rem; }
.ex-head { font-weight: 600; font-size: 1.05rem; }
.field { display: grid; gap: 0.25rem; }
.field textarea { min-height: 80px; padding: 0.6rem; border: 1px solid #ddd; border-radius: 8px; resize: vertical; }
.upload { display: inline-grid; border: 1px solid #ddd; padding: 0.5rem 0.75rem; border-radius: 8px; cursor: pointer; background: #fafafa; }
.upload input { display: none; }
.thumbs { display: grid; gap: 0.25rem; list-style: none; padding: 0.25rem 0 0; margin: 0; color: #6b7280; font-size: 0.9rem; }
.thumbs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 0.5rem; list-style: none; padding: 0.5rem 0 0; margin: 0; }
.thumb-item { position: relative; }
.thumb-item img { width: 100%; height: 96px; object-fit: cover; border: 1px solid #eee; border-radius: 6px; }
.thumb-item .remove { position: absolute; top: 4px; right: 4px; border: none; background: rgba(0,0,0,0.6); color: #fff; width: 22px; height: 22px; border-radius: 50%; font-size: 12px; line-height: 22px; text-align: center; cursor: pointer; }

.container { max-width: 960px; margin: 0 auto; }

.divider-tight { margin-top: -0.3rem; margin-bottom: 0.15rem; }

.bottom-bar { display: flex; justify-content: flex-end; gap: 0.5rem; position: sticky; bottom: 0; background: white; padding: 0.75rem 0; }
</style>
