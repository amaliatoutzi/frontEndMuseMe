<template>
  <section class="museums-page">
    <h2>Browse</h2>

    <div class="controls">
      <input
        v-model="query"
        type="search"
        class="search"
        placeholder="Search by name, address, tags…"
        @input="onSearchInput"
      />
      <button class="filter-btn" @click="openFilters" aria-haspopup="dialog" :aria-expanded="showFilters">
        <Icon name="refresh" :size="16" /> Filters
        <span v-if="hasActiveFilters" class="badge">1</span>
      </button>
      <div class="view-toggle" role="tablist" aria-label="View">
        <button role="tab" :aria-selected="viewMode==='list'" class="toggle" :class="{ active: viewMode==='list' }" @click="viewMode='list'">List</button>
        <button role="tab" :aria-selected="viewMode==='map'" class="toggle" :class="{ active: viewMode==='map' }" @click="viewMode='map'">Map</button>
      </div>
    </div>

    <!-- Filters Modal -->
    <div v-if="showFilters" class="modal-overlay" role="dialog" aria-modal="true" @click.self="closeFilters">
      <div class="modal">
        <header class="modal-header">
          <h3>Filters</h3>
          <button class="close" @click="closeFilters" aria-label="Close">✕</button>
        </header>
        <div class="modal-body">
          <label class="field">
            <span>Borough</span>
            <select v-model="borough" class="select">
              <option value="">All boroughs</option>
              <option v-for="b in boroughs" :key="b" :value="b">{{ b }}</option>
            </select>
          </label>
          <label class="field">
            <span>Tag</span>
            <select v-model="selectedTag" class="select">
              <option value="">All tags</option>
              <option v-for="t in tags" :key="t" :value="t">{{ formatTag(t) }}</option>
            </select>
          </label>
        </div>
        <footer class="modal-footer">
          <button class="ghost" @click="clearFilters">Clear</button>
          <button class="primary" @click="applyAndClose">Apply</button>
        </footer>
      </div>
    </div>

    <div v-if="loading" class="status">Loading…</div>
    <div v-else-if="filtered.length === 0" class="status">No results</div>

    <MuseumMap v-if="!loading && filtered.length && viewMode==='map'" :museums="filtered" height="520px" @open="openMuseum" />

    <ul v-if="viewMode==='list'" class="grid">
      <li v-for="m in paged" :key="m.id" class="card" @click="openMuseum(m.id)">
        <div v-if="m.pictureUrl" class="media">
          <img :src="m.pictureUrl" :alt="m.name + ' photo'" loading="lazy" />
        </div>
        <h3 class="title">{{ m.name }}</h3>
        <p class="meta">
          <span v-if="m.borough">{{ m.borough }}</span>
          <span v-if="m.address"> • {{ m.address }}</span>
        </p>
        <p class="tags" v-if="m.tags?.length">
          <span v-for="t in m.tags" :key="t" class="tag">{{ formatTag(t) }}</span>
        </p>
        <div class="row" @click.stop>
          <p class="link" v-if="m.website">
            <a :href="m.website" target="_blank" rel="noopener" class="icon-link" aria-label="Website" title="Website"><Icon name="globe" :size="18" /></a>
          </p>
          <p class="link">
            <a :href="mapsUrl(m)" target="_blank" rel="noopener" class="icon-link" aria-label="Directions" title="Directions"><Icon name="map-pin" :size="18" /></a>
          </p>
          <button
            class="bookmark-btn"
            :disabled="!userId"
            @click="toggleSave(m.id)"
            :title="!userId ? 'Login to save' : (isSaved(m.id) ? 'Unsave' : 'Save')"
            :aria-pressed="isSaved(m.id) ? 'true' : 'false'"
            aria-label="Bookmark"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              :fill="isSaved(m.id) ? 'currentColor' : 'none'"
              :stroke="isSaved(m.id) ? 'none' : 'currentColor'"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M6 2h12a2 2 0 0 1 2 2v16l-8-4-8 4V4a2 2 0 0 1 2-2z" />
            </svg>
          </button>
        </div>
      </li>
    </ul>

    <MuseumDetailsModal v-model="showDetails" :museum-id="selectedMuseumId" />

    <div v-if="filtered.length > 0 && viewMode==='list'" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="prevPage" aria-label="Previous page">Prev</button>
      <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="nextPage" aria-label="Next page">Next</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { allMuseums, listBoroughs, listTags, searchMuseums } from '../utils/catalog';
import { useAuthStore } from '../stores/auth';
import { storeToRefs } from 'pinia';
import { useSavingStore } from '../stores/saving';
import MuseumDetailsModal from '../components/MuseumDetailsModal.vue';
import MuseumMap from '../components/common/MuseumMap.vue';
import Icon from '../components/ui/Icon.vue';

const loading = ref(false);
const boroughs = listBoroughs();
const tags = listTags();

const query = ref('');
const borough = ref('');
const selectedTag = ref('');
const showFilters = ref(false);

let debounceTimer: number | undefined;
function onSearchInput() {
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    // trigger recompute via query ref itself
    query.value = query.value;
  }, 150);
}

const filtered = computed(() => {
  const tagFilter = selectedTag.value ? [selectedTag.value] : undefined;
  return searchMuseums(query.value, {
    borough: borough.value || undefined,
    tags: tagFilter,
  });
});

// List / Map view toggle
const viewMode = ref<'list' | 'map'>('list');

const hasActiveFilters = computed(() => !!(borough.value || selectedTag.value));

function openFilters() {
  showFilters.value = true;
  document.addEventListener('keydown', onEsc, { passive: true });
}
function closeFilters() {
  showFilters.value = false;
  document.removeEventListener('keydown', onEsc as any);
}
function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') closeFilters();
}
function clearFilters() {
  borough.value = '';
  selectedTag.value = '';
}
function applyAndClose() {
  // Filters are bound, so just close
  closeFilters();
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onEsc as any);
});

// Saving integration
const auth = useAuthStore();
const { currentUserId: userId } = storeToRefs(auth);
const saving = useSavingStore();

onMounted(() => {
  if (userId.value) {
    saving.syncFromServer(userId.value);
  }
});

function isSaved(itemId: string): boolean {
  return userId.value ? saving.isSaved(userId.value, itemId) : false;
}

async function toggleSave(itemId: string) {
  if (!userId.value) return;
  if (saving.isSaved(userId.value, itemId)) {
    try {
      await saving.unsave(userId.value, itemId);
    } catch (e: any) {
      alert(e?.message || 'Failed to unsave');
    }
  } else {
    try {
      await saving.save(userId.value, itemId);
    } catch (e: any) {
      alert(e?.message || 'Failed to save');
    }
  }
}

function formatTag(tag: string): string {
  // Insert a space between lower->Upper boundaries, e.g., AfricanAmerican -> African American
  return tag.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function mapsUrl(m: { name: string; address?: string; borough?: string; zip?: string }): string {
  const parts = [m.address || m.name, m.borough, 'New York, NY', m.zip].filter(Boolean) as string[];
  const dest = encodeURIComponent(parts.join(', '));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

// Pagination
const PAGE_SIZE = 15;
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));
const paged = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filtered.value.slice(start, start + PAGE_SIZE);
});

function goToPage(p: number) {
  const tp = totalPages.value;
  currentPage.value = Math.min(tp, Math.max(1, p));
}
function nextPage() { goToPage(currentPage.value + 1); }
function prevPage() { goToPage(currentPage.value - 1); }

// Reset/clamp page when filters/search change or totalPages shrinks
watch([query, borough, selectedTag], () => {
  currentPage.value = 1;
});
watch(totalPages, (tp) => {
  if (currentPage.value > tp) currentPage.value = tp;
});

// Modal selection
const showDetails = ref(false);
const selectedMuseumId = ref<string | null>(null);
function openMuseum(id: string) { selectedMuseumId.value = id; showDetails.value = true; }
</script>

<style scoped>
.museums-page {
  display: grid;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem; /* left/right page padding */
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.view-toggle { display: inline-flex; gap: 0.25rem; margin-left: auto; }
.toggle { padding: 0.45rem 0.75rem; border: 1px solid #ddd; background: #fafafa; border-radius: 999px; }
.toggle.active { background: var(--brand-600); color: #fff; border-color: var(--brand-600); }
.search {
  flex: 1 1 260px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.filter-btn { padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 8px; background: #fafafa; display: inline-flex; align-items: center; gap: 0.35rem; }
.filter-btn:hover { background: #f1f1f1; }
.badge { background: #111; color: #fff; font-size: 0.75rem; line-height: 1; padding: 0.1rem 0.4rem; border-radius: 999px; }
.select { padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 8px; background: white; }
.select:focus { outline: none; border-color: var(--brand-500); box-shadow: 0 0 0 3px rgba(124,45,75,0.25); }
.select option:checked { background: var(--brand-600); color: #fff; }
.status { color: #666; }
.grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem; /* space between columns/rows */
  padding: 0;
  margin: 0;
}
.card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 0.75rem;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.media { margin: -0.75rem -0.75rem 0.5rem; height: 160px; overflow: hidden; border-top-left-radius: 10px; border-top-right-radius: 10px; background: #f3f4f6; }
.media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.row {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* Push this row to the bottom so actions align across cards */
  margin-top: auto;
}
.title {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}
.meta {
  margin: 0 0 0.5rem 0;
  color: #555;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.tag {
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border: 1px solid #eee;
  border-radius: 999px;
  color: #444;
}
.link a { color: #0b72ef; text-decoration: none; }
.link a:hover { text-decoration: underline; }
.link + .link { margin-left: 0.5rem; }
.icon-link { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; background: #fff; border: 1px solid var(--border); }
.icon-link:hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.bookmark-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #444;
  border-radius: 6px;
}
.bookmark-btn:hover { background: #f1f1f1; }
.bookmark-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 0.75rem; }
.page-btn { padding: 0.45rem 0.8rem; border: 1px solid #ddd; background: #fafafa; border-radius: 8px; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-indicator { color: #555; }

/* Modal styles */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: grid; place-items: center; z-index: 50; padding: 1rem; }
.modal { width: 100%; max-width: 520px; background: #fff; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: grid; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0; }
.modal-body { display: grid; gap: 0.75rem; padding: 0.75rem 1rem; }
.modal-footer { display: flex; gap: 0.5rem; justify-content: flex-end; padding: 0.75rem 1rem; border-top: 1px solid #f0f0f0; }
.close { background: transparent; border: none; font-size: 1rem; cursor: pointer; }
.close:hover { color: var(--accent-gold); }
.ghost { background: #fafafa; border: 1px solid #ddd; border-radius: 8px; padding: 0.45rem 0.8rem; }
.primary { background: var(--brand-600); border: 1px solid var(--brand-600); border-radius: 8px; padding: 0.45rem 0.8rem; color: #fff; }
.primary:hover { background: var(--brand-700); border-color: var(--brand-700); }
label.field { display: grid; gap: 0.25rem; }
</style>
