<template>
  <div class="visits-panel">
    <div v-if="!userId">Not authenticated.</div>
    <div v-else>
      <h3>My Visits</h3>

      <form v-if="props.showCreate" class="create" @submit.prevent="onCreate">
        <label>
          Museum
          <select v-model="museumId" required>
            <option value="" disabled>Select a museum…</option>
            <option v-for="m in museums" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </label>
        <label>
          Title (optional)
          <input type="text" v-model="title" placeholder="e.g., Saturday at the Met" />
        </label>
        <button type="submit" :disabled="creating">{{ creating ? 'Creating…' : 'Create visit' }}</button>
      </form>

      <div class="list">
  <div v-if="loadingVisits">Loading visits…</div>
  <p v-else-if="visits.length === 0" class="banner empty">No visits yet. Create your first one above.</p>
        <ul v-else class="visits">
          <li v-for="v in visits" :key="v._id" class="visit">
            <div class="visit-header">
              <div class="info">
                <strong>{{ v.title || museumName(v.museum) }}</strong>
                <span class="muted"> • {{ museumName(v.museum) }}</span>
                <span class="muted"> • {{ formatDate(v.createdAt) }}</span>
              </div>
              <div class="actions">
                <button
                  class="chevron-btn"
                  @click="toggle(v._id)"
                  :aria-expanded="expanded[v._id] ? 'true' : 'false'"
                  :aria-label="expanded[v._id] ? 'Collapse' : 'Expand'"
                  title="Toggle details"
                >
                  <svg
                    class="chevron"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                    :class="{ rotated: expanded[v._id] }"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>

            <Transition name="fade-slide">
            <div v-if="expanded[v._id]" class="visit-body">
              <div v-if="props.allowAddEntries" class="add-entry">
                <label>
                  Exhibit
                  <select v-model="entryExhibit[v._id]">
                    <option value="" disabled>Select…</option>
                    <option v-for="e in exhibitsOf(v.museum)" :key="e.id" :value="e.id">{{ e.name }}</option>
                  </select>
                </label>
                <label>
                  Note
                  <input type="text" v-model="entryNote[v._id]" placeholder="What did you think?" />
                </label>
                <label>
                  Rating
                  <StarRating v-model="entryRating[v._id]" />
                </label>
                <label>
                  Photo URL
                  <input type="url" v-model="entryPhotoUrl[v._id]" placeholder="https://…" />
                </label>
                <button @click="add(v._id)" :disabled="!entryExhibit[v._id] || adding[v._id]">{{ adding[v._id] ? 'Adding…' : 'Add entry' }}</button>
              </div>

              <div class="entries">
                <div v-if="loadingEntries[v._id]">Loading entries…</div>
                <p v-else-if="entries(v._id).length === 0" class="banner empty">No entries yet.</p>
                <ul v-else class="entry-list">
                  <li v-for="en in entries(v._id)" :key="en._id" class="entry-row">
                    <div class="entry-main">
                      <div class="entry-title">
                        <strong>{{ exhibitLabel(v.museum, en.exhibit) }}</strong>
                      </div>
                      <template v-if="!isEditing[en._id]">
                        <div class="entry-note" v-if="en.note || (en.rating && en.rating > 0)">
                          <span
                            v-if="en.rating && en.rating > 0"
                            class="stars-inline"
                            :aria-label="`Rated ${en.rating} out of 5`"
                          >
                            <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= en.rating }">★</span>
                          </span>
                          <span v-if="en.rating && en.rating > 0 && en.note" class="sep"> • </span>
                          <template v-if="en.note">
                            <span class="muted" v-if="!en.rating || en.rating <= 0">— </span>{{ en.note }}
                          </template>
                        </div>
                        <ul v-if="urlsFor(en).length" class="thumbs">
                          <li v-for="(u, i) in urlsFor(en)" :key="i" class="thumb">
                            <a :href="u" target="_blank" rel="noopener noreferrer">
                              <img :src="u" :alt="`Photo of ${exhibitLabel(v.museum, en.exhibit)}`" loading="lazy" @error="hideImg" />
                            </a>
                          </li>
                        </ul>
                      </template>
                      <template v-else></template>
                    </div>
                    <div class="entry-actions" v-if="!isEditing[en._id]">
                      <button class="remove" @click="remove(en._id, v._id)">Delete Visit</button>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            </Transition>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../../stores/auth';
import { useVisitsStore } from '../../stores/visits';
import { allMuseums, getMuseumById, listExhibits, exhibitName } from '../../utils/catalog';
import StarRating from '../common/StarRating.vue';
import Icon from '../ui/Icon.vue';

const props = withDefaults(defineProps<{ userId: string; showCreate?: boolean; autoSync?: boolean; allowAddEntries?: boolean }>(), { showCreate: true, autoSync: true, allowAddEntries: true });

const auth = useAuthStore();
const visitsStore = useVisitsStore();
const { currentUserId } = storeToRefs(auth);

const museums = allMuseums;
const museumId = ref('');
const title = ref('');
const creating = ref(false);

const visits = computed(() => visitsStore.visitsForUser(props.userId));
const loadingVisits = computed(() => visitsStore.loadingVisits[props.userId] === true);
const loadingEntries = reactive<Record<string, boolean>>({});

const expanded = ref<Record<string, boolean>>({});
const entryExhibit = reactive<Record<string, string>>({});
const entryNote = reactive<Record<string, string>>({});
const adding = reactive<Record<string, boolean>>({});
const entryRating = reactive<Record<string, number>>({});
const entryPhotoUrl = reactive<Record<string, string>>({});
const deleting = reactive<Record<string, boolean>>({});
const isEditing = reactive<Record<string, boolean>>({});

function museumName(id: string): string { return getMuseumById(id)?.name || id; }
function exhibitsOf(id: string) { return listExhibits(id); }
function entries(visitId: string) { return visitsStore.entriesForVisit(visitId); }
function exhibitLabel(museum: string, ex: string) { return exhibitName(museum, ex); }
function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

async function onCreate() {
  if (!props.userId || !museumId.value) return;
  creating.value = true;
  try {
    await visitsStore.create(props.userId, museumId.value, title.value || undefined);
    // Reset form
    museumId.value = '';
    title.value = '';
  } catch (e: any) {
    alert(e?.message || 'Failed to create visit');
  } finally {
    creating.value = false;
  }
}

function toggle(visitId: string) {
  const next = !expanded.value[visitId];
  expanded.value[visitId] = next;
  if (next) {
    // Fetch entries when opening
    visitsStore.syncEntries(visitId);
  }
}

async function add(visitId: string) {
  const ex = entryExhibit[visitId];
  if (!ex) return;
  const note = (entryNote[visitId] || '').trim();
  adding[visitId] = true;
  try {
    const rating = Math.max(1, Math.min(5, entryRating[visitId] || 0));
    const photo = (entryPhotoUrl[visitId] || '').trim();
    if (!photo) throw new Error('Please provide at least one Photo URL');
    if (!rating) throw new Error('Please select a rating (1–5)');
    await visitsStore.addEntry(visitId, ex, props.userId, note, [photo], rating);
    entryExhibit[visitId] = '';
    entryNote[visitId] = '';
    entryRating[visitId] = 0 as any;
    entryPhotoUrl[visitId] = '';
  } catch (e: any) {
    alert(e?.message || 'Failed to add entry');
  } finally {
    adding[visitId] = false;
  }
}

async function remove(entryId: string, visitId: string) {
  try {
    await visitsStore.removeEntry(entryId, visitId, props.userId);
  } catch (e: any) {
    alert(e?.message || 'Failed to remove entry');
  }
}

async function onDelete(visitId: string) {
  if (!confirm('Delete this visit? This cannot be undone.')) return;
  deleting[visitId] = true;
  try {
    await visitsStore.removeVisit(visitId, props.userId);
  } catch (e: any) {
    alert(e?.message || 'Failed to delete visit');
  } finally {
    deleting[visitId] = false;
  }
}

// Editing disabled: editEntry removed from backend/front-end. Removing visit now cascades.

function urlsFor(en: any): string[] {
  const out: string[] = [];
  const push = (v: any) => { if (typeof v === 'string' && v.trim()) out.push(v.trim()); };
  if (en?.photoUrl) push(en.photoUrl);
  if (Array.isArray(en?.photoUrls)) en.photoUrls.forEach(push);
  if (Array.isArray(en?.photos)) en.photos.forEach(push);
  if (en?.photo) push(en.photo);
  // dedupe while keeping order
  return Array.from(new Set(out));
}

function hideImg(e: Event) {
  const img = e.target as HTMLImageElement;
  if (img) img.style.display = 'none';
}

function parseRatingFromNote(note: string): { rating: number; restNote: string } {
  if (!note) return { rating: 0, restNote: '' };
  const m = note.match(/^\s*Rating:\s*(\d+)\s*\/\s*5\.?\s*(.*)$/i);
  if (!m) return { rating: 0, restNote: note };
  const rating = Math.max(0, Math.min(5, parseInt(m[1], 10) || 0));
  const restNote = m[2] || '';
  return { rating, restNote };
}

// Photo picking disabled (no edit support)

onMounted(() => {
  if (props.userId && props.autoSync) visitsStore.syncVisits(props.userId);
});
</script>

<style scoped>
.visits-panel { display: grid; gap: 1rem; }
.visits-panel h3 { color: #111; }
.create { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: end; }
.create label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
.create select, .create input { padding: 0.4rem 0.6rem; border: 1px solid #ddd; border-radius: 6px; }
.create button { padding: 0.45rem 0.75rem; border: 1px solid #ddd; background: #fafafa; border-radius: 6px; }
.create button:hover { background: #eee; }

.list { display: grid; gap: 0.75rem; }
.visits { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
.visit { border: 1px solid var(--brand-100); border-radius: 8px; padding: 0.75rem; background: #fff; }
.visit-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.visit-header .info { display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; }
.visit-header .info strong { color: var(--brand-600); }
.muted { color: #666; }
.actions { display: inline-flex; gap: 0.4rem; }
.chevron-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; border: none; background: transparent; color: inherit; }
.chevron-btn:hover { background: var(--surface-2); }
.chevron { transition: transform var(--dur-quick) var(--ease-standard); }
.chevron.rotated { transform: rotate(180deg); }
.danger { border: 1px solid #f5c2c7; background: #fff5f5; color: #b91c1c; border-radius: 6px; padding: 0.35rem 0.6rem; }
.toggle:hover { background: #eee; }

.visit-body { display: grid; gap: 0.75rem; margin-top: 0.5rem; }
.add-entry { display: flex; gap: 0.5rem; align-items: end; flex-wrap: wrap; }
.add-entry label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
.add-entry select, .add-entry input { padding: 0.4rem 0.6rem; border: 1px solid #ddd; border-radius: 6px; }
.add-entry button { padding: 0.35rem 0.6rem; border: 1px solid #ddd; background: #fafafa; border-radius: 6px; }
.add-entry button:hover { background: #eee; }

.entries { display: grid; gap: 0.5rem; }
.entry-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
.entry-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; border: 1px solid var(--brand-100); border-radius: 6px; padding: 0.5rem 0.75rem; background: #fff; }
.entry-main { display: grid; gap: 0.25rem; }
.entry-title { line-height: 1.2; }
.entry-title strong { color: var(--brand-600); }
.entry-note { color: #333; }
.entry-note .sep { color: #6b7280; }
.stars-inline { display: inline-flex; gap: 0.1rem; vertical-align: text-bottom; }
.stars-inline .star { color: #d1d5db; font-size: 1rem; line-height: 1; }
.stars-inline .star.filled { color: #f5b301; }
.edit-card { display: grid; gap: 0.5rem; border: 1px solid #eee; background: #fff; border-radius: 8px; padding: 0.6rem; }
.edit-field { display: grid; gap: 0.25rem; }
.edit-field textarea { min-height: 70px; padding: 0.45rem 0.6rem; border: 1px solid #ddd; border-radius: 6px; resize: vertical; }
.edit-field input { padding: 0.4rem 0.6rem; border: 1px solid #ddd; border-radius: 6px; }
.edit-actions { display: inline-flex; gap: 0.35rem; }
.entry-actions { display: inline-flex; gap: 0.35rem; }
.edit, .save, .cancel { border: 1px solid #ddd; background: #fafafa; border-radius: 6px; padding: 0.3rem 0.55rem; transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard); }
.edit:hover, .save:hover, .cancel:hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.remove { border: 1px solid #ddd; background: #fafafa; border-radius: 6px; padding: 0.3rem 0.55rem; transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard); }
.remove:hover { background: var(--accent-gold); border-color: var(--accent-gold); color: #fff; }

.thumbs { display: grid; grid-auto-flow: column; grid-auto-columns: min-content; gap: 0.35rem; padding: 0.2rem 0 0; margin: 0; list-style: none; }
.thumb img { width: 72px; height: 72px; object-fit: cover; border-radius: 6px; border: 1px solid var(--brand-100); background: #f9f9f9; }

/* Upload button style to match add visit */
.upload { display: inline-grid; border: 1px solid #ddd; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer; background: #fafafa; width: fit-content; transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard); }
.upload:hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.upload input { display: none; }
.upload-text { display: inline-flex; align-items: center; gap: 0.35rem; }
.preview-one img { width: 120px; height: 120px; object-fit: cover; border: 1px solid #eee; border-radius: 6px; margin-top: 0.35rem; }
</style>
