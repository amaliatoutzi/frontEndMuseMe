<template>
  <section class="search-page">
    <h2>Search</h2>
    <div class="filter-row">
      <button class="btn" @click="openFilters" aria-haspopup="dialog" :aria-expanded="showFilters">Filters</button>
      <span v-if="hasActiveFilters" class="badge" aria-label="Active filters"></span>
    </div>

    <Modal v-model="showFilters" title="Filters">
      <template #default>
        <div class="modal-body-grid">
          <div class="group">
            <h4 class="group-title">Types</h4>
            <label class="check"><input type="checkbox" v-model="types.user" /> Users</label>
            <label class="check"><input type="checkbox" v-model="types.museum" /> Museums</label>
            <label class="check"><input type="checkbox" v-model="types.exhibit" /> Exhibits</label>
          </div>
          <div class="group" v-if="types.museum || types.exhibit">
            <h4 class="group-title">Refine</h4>
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
                <option v-for="t in allTags" :key="t" :value="t">{{ formatTag(t) }}</option>
              </select>
            </label>
          </div>
        </div>
      </template>
      <template #actions>
        <button class="btn" @click="clearFilters">Clear</button>
        <button class="btn primary" @click="applyAndClose">Apply</button>
      </template>
    </Modal>

  <p v-if="!q" class="banner empty">Type in the top search bar to begin.</p>

    <div v-else class="results">
      <section v-if="userResult && types.user" class="block">
        <h3 class="block-title">Users</h3>
        <ul class="list">
          <li class="row">
            <div class="left">
              <Avatar :first-name="profile?.firstName || null" :last-name="profile?.lastName || null" :username="q" :url="profile?.profilePictureUrl || null" :size="28" />
              <div>
                <p class="name">@{{ q }}</p>
                <p class="meta">User</p>
              </div>
            </div>
            <button
              class="btn"
              :disabled="!isAuthed || busy"
              @click="toggleFollow"
              :aria-pressed="isFollowing ? 'true' : 'false'"
              :title="!isAuthed ? 'Login to follow' : (isFollowing ? 'Unfollow' : 'Follow')"
            >
              {{ isFollowing ? 'Unfollow' : 'Follow' }}
            </button>
          </li>
        </ul>
      </section>

      <section v-if="museums.length && types.museum" class="block">
        <h3 class="block-title">Museums</h3>
        <ul class="grid">
          <li v-for="m in museums" :key="m.id">
            <MuseumCard :museum-id="m.id" :show-save="true" />
          </li>
        </ul>
      </section>

      <section v-if="exhibits.length && types.exhibit" class="block">
        <h3 class="block-title">Exhibits</h3>
        <ul class="list">
          <li v-for="ex in exhibits" :key="ex.key" class="row">
            <div class="left">
              <span class="avatar" aria-hidden="true">🎨</span>
              <div>
                <p class="name">{{ ex.name }}</p>
                <p class="meta">{{ ex.museumName }}</p>
              </div>
            </div>
          </li>
        </ul>
      </section>

  <p v-if="q && !anyResult" class="banner empty">No results found.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { listTags, listBoroughs, searchMuseums, allMuseums } from '../utils/catalog';
import { getUserIdByUsername } from '../api/users';
import { follow, unfollow, getFollowees } from '../api/following';
import { useAuthStore } from '../stores/auth';
import { storeToRefs } from 'pinia';
import MuseumCard from '../components/MuseumCard.vue';
import Modal from '../components/ui/Modal.vue';
import Avatar from '../components/profile/Avatar.vue';
import { getProfile, type Profile } from '../api/profile';

const route = useRoute();

const q = ref<string>((route.query.q as string) || '');
const userId = ref<string | null>(null);
const profile = ref<Profile | null>(null);
const userResult = computed(() => !!userId.value);
const busy = ref(false);
const error = ref<string | null>(null);

const auth = useAuthStore();
const { currentUserId } = storeToRefs(auth);
const isAuthed = computed(() => !!currentUserId.value);
const isFollowing = ref(false);

const allTags = listTags();
const boroughs = listBoroughs();

// Filters
const types = ref({ user: true, museum: true, exhibit: true });
const borough = ref('');
const selectedTag = ref('');
const showFilters = ref(false);
function openFilters() { showFilters.value = true; }
function applyAndClose() { showFilters.value = false; }
function clearFilters() {
  types.value = { user: true, museum: true, exhibit: true };
  borough.value = '';
  selectedTag.value = '';
}
const hasActiveFilters = computed(() => !!(borough.value || selectedTag.value || !types.value.user || !types.value.museum || !types.value.exhibit));

const museums = computed(() => {
  if (!q.value || !types.value.museum) return [] as any[];
  const filter = {
    borough: borough.value || undefined,
    tags: selectedTag.value ? [selectedTag.value] : undefined,
  } as any;
  return searchMuseums(q.value, filter).slice(0, 30);
});

const exhibits = computed(() => {
  if (!q.value || !types.value.exhibit) return [] as Array<{ key: string; name: string; museumId: string; museumName: string }>;
  const ql = q.value.toLowerCase();
  const tagFilter = selectedTag.value ? [selectedTag.value] : undefined;
  const results: Array<{ key: string; name: string; museumId: string; museumName: string }> = [];
  for (const m of allMuseums) {
    if (borough.value && m.borough !== borough.value) continue;
    if (tagFilter?.length) {
      const mt = new Set(m.tags || []);
      let any = false;
      for (const t of tagFilter) { if (mt.has(t)) { any = true; break; } }
      if (!any) continue;
    }
    for (const ex of (m.exhibits || [])) {
      const name = (ex.name || '').toLowerCase();
      if (!ql || name.includes(ql)) {
        results.push({ key: `${m.id}:${ex.id}`, name: ex.name, museumId: m.id, museumName: m.name });
        if (results.length >= 40) return results;
      }
    }
  }
  return results;
});

const anyResult = computed(() => !!( (types.value.user && userResult.value) || (types.value.museum && museums.value.length) || (types.value.exhibit && exhibits.value.length)));

async function lookupUser() {
  const name = q.value.trim();
  if (!name) { userId.value = null; profile.value = null; return; }
  try {
    userId.value = await getUserIdByUsername(name);
    await refreshFollowingStatus();
    try {
      profile.value = userId.value ? await getProfile(userId.value) : null;
    } catch { profile.value = null; }
  } catch {
    userId.value = null; profile.value = null; // if endpoint missing or error, ignore user results
  }
}

async function refreshFollowingStatus() {
  isFollowing.value = false;
  if (!currentUserId.value || !userId.value) return;
  try {
    const followees = await getFollowees(currentUserId.value);
    isFollowing.value = followees.includes(userId.value);
  } catch { /* ignore */ }
}

onMounted(lookupUser);
watch(() => route.query.q, (v) => { q.value = (v as string) || ''; lookupUser(); });
watch([currentUserId, userId], () => { refreshFollowingStatus(); });

function formatTag(tag: string): string {
  return tag.replace(/([a-z])([A-Z])/g, '$1 $2');
}

async function toggleFollow() {
  if (!isAuthed.value || !currentUserId.value || !userId.value) return;
  busy.value = true; error.value = null;
  try {
    if (isFollowing.value) {
      await unfollow(currentUserId.value, userId.value);
      isFollowing.value = false;
    } else {
      await follow(currentUserId.value, userId.value);
      isFollowing.value = true;
    }
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || 'Action failed';
    alert(error.value);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.search-page { display: grid; gap: 1rem; max-width: 1000px; margin: 0 auto; padding: 0 1rem; }
.searchbar { display: flex; gap: 0.5rem; }
.searchbar input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 8px; }
.btn { padding: 0.5rem 0.8rem; border: 1px solid #ddd; background: #fafafa; border-radius: 8px; }
.filter-row { display: flex; align-items: center; gap: 0.5rem; }
.badge { width: 10px; height: 10px; border-radius: 999px; background: #111827; display: inline-block; }
.select { padding: 0.45rem 0.6rem; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
.status { color: var(--muted); }
.block { display: grid; gap: 0.5rem; }
.block + .block { margin-top: 0.25rem; }
.block-title { margin: 0; font-size: 1.05rem; }
.grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; border: 1px solid var(--border); border-radius: 10px; padding: 0.5rem 0.6rem; }
.left { display: inline-flex; align-items: center; gap: 0.5rem; }
.avatar { width: 28px; height: 28px; border-radius: 999px; background: var(--brand-600); color: #fff; display: grid; place-items: center; font-weight: 700; }
.name { margin: 0; font-weight: 600; }
.meta { margin: 0; color: #6b7280; font-size: 0.9rem; }

.modal-body-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.group-title { margin: 0 0 0.25rem 0; font-size: 0.95rem; color: #374151; }
.check { display: flex; align-items: center; gap: 0.4rem; }
.field { display: grid; gap: 0.25rem; }
</style>
