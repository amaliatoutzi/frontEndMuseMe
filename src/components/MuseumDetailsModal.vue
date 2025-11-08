<template>
  <Modal v-model="open" :title="museum?.name || 'Museum'">
    <template #default>
      <div v-if="museum" class="content">
        <div v-if="museum.pictureUrl" class="media">
          <img :src="museum.pictureUrl" :alt="museum.name + ' photo'" />
        </div>
  <div class="meta">
          <p class="location" v-if="museum.borough || museum.address">
            <span v-if="museum.borough">{{ museum.borough }}</span>
            <span v-if="museum.address"> • {{ museum.address }}</span>
            <span v-if="museum.zip"> • {{ museum.zip }}</span>
          </p>
          <div class="tags" v-if="museum.tags?.length">
            <span v-for="t in museum.tags" :key="t" class="tag">{{ formatTag(t) }}</span>
          </div>
          <div class="actions">
            <a class="icon-link" :href="mapsUrl" target="_blank" rel="noopener" aria-label="Directions" title="Directions">
              <Icon name="map-pin" :size="18" />
            </a>
            <a v-if="museum.website" class="icon-link" :href="museum.website" target="_blank" rel="noopener" aria-label="Website" title="Website">
              <Icon name="globe" :size="18" />
            </a>
            <button
              class="save-btn"
              :disabled="!userId || !museum?.id"
              @click="toggleSave()"
              :aria-pressed="saved ? 'true' : 'false'"
              :title="!userId ? 'Login to save' : (saved ? 'Unsave' : 'Save')"
              :aria-label="!userId ? 'Login to save' : (saved ? 'Unsave' : 'Save')"
            >
              <Icon name="bookmark" :size="18" :filled="saved" />
            </button>
          </div>
        </div>

        <div class="exhibits">
          <h4>Exhibits</h4>
          <p v-if="exhibits.length === 0" class="empty">No exhibits listed.</p>
          <ul v-else class="ex-list">
            <li v-for="ex in exhibits" :key="ex.id" class="ex">
              <div class="ex-name">{{ ex.name }}</div>
              <div class="ex-sub" v-if="ex.start_date || ex.end_date || ex.type || ex.gallery">
                <span v-if="ex.type">{{ formatCategory(ex.type) }}</span>
                <span v-if="ex.gallery"> • {{ formatCategory(ex.gallery) }}</span>
                <span v-if="ex.start_date || ex.end_date"> • {{ formatDates(ex.start_date, ex.end_date) }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div v-else>
        <p class="empty">Unknown museum.</p>
      </div>
    </template>
    <template #actions>
      <button class="btn" @click="emit('update:modelValue', false)">Close</button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import Modal from './ui/Modal.vue';
import Icon from './ui/Icon.vue';
import { getMuseumById, listExhibits, type Museum, type Exhibit } from '../utils/catalog';
import { useAuthStore } from '../stores/auth';
import { useSavingStore } from '../stores/saving';
import { storeToRefs } from 'pinia';
import { useToastStore } from '../stores/toast';

const props = defineProps<{ modelValue: boolean; museumId: string | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});

const museum = computed<Museum | undefined>(() => (props.museumId ? getMuseumById(props.museumId) : undefined));
const exhibits = computed<Exhibit[]>(() => (props.museumId ? listExhibits(props.museumId) : []));

const mapsUrl = computed(() => {
  const m = museum.value;
  if (!m) return '#';
  const parts = [m.address || m.name, m.borough, 'New York, NY', m.zip].filter(Boolean) as string[];
  const dest = encodeURIComponent(parts.join(', '));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
});

function formatTag(tag: string): string {
  return tag.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function formatCategory(raw?: string): string {
  if (!raw) return '';
  let s = raw.replace(/[\-_]+/g, ' ');
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function formatDates(start?: string, end?: string): string {
  if (!start && !end) return '';
  if (start && end) return `${start} – ${end}`;
  return start ? `From ${start}` : `Until ${end}`;
}

// Saving integration
const auth = useAuthStore();
const { currentUserId: userId } = storeToRefs(auth);
const saving = useSavingStore();
const toast = useToastStore();

const saved = computed(() => (userId.value && museum.value?.id ? saving.isSaved(userId.value, museum.value.id) : false));

async function toggleSave() {
  if (!userId.value || !museum.value?.id) return;
  const id = museum.value.id;
  try {
    if (saving.isSaved(userId.value, id)) {
      await saving.unsave(userId.value, id);
      toast.info('Removed from Saved');
    } else {
      await saving.save(userId.value, id);
      toast.success('Saved to bookmarks');
    }
  } catch (e: any) {
    toast.error(e?.message || 'Failed to update saved state');
  }
}

// Best-effort: ensure saved state is current when the modal opens
watch(open, async (v) => {
  if (v && userId.value) {
    try { await saving.syncFromServer(userId.value); } catch {}
  }
});
</script>

<style scoped>
.content { display: grid; gap: 0.75rem; }
.media { margin: -0.5rem 0 0 0; height: 180px; overflow: hidden; border-radius: 8px; background: #f3f4f6; }
.media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.meta { display: grid; gap: 0.4rem; }
.location { margin: 0; color: #4b5563; }
.tags { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.tag { font-size: 0.75rem; padding: 0.1rem 0.4rem; border: 1px solid #eee; border-radius: 999px; color: #444; }
.actions { display: inline-flex; gap: 0.35rem; }
.save-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.5rem; border: 1px solid var(--border); background: #fff; border-radius: 8px; cursor: pointer; color: var(--brand-600); transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard); }
/* Match non-popup card behavior: always white background; only hover changes */
.save-btn:hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.icon-link { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; background: #fff; border: 1px solid var(--border); color: #111; }
.icon-link:hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.exhibits { display: grid; gap: 0.5rem; }
.exhibits h4 { margin: 0; font-size: 1.05rem; }
.ex-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.4rem; max-height: 220px; overflow: auto; padding-right: 2px; }
.ex { padding: 0.25rem 0; border-bottom: 1px solid #f1f1f1; }
.ex:last-child { border-bottom: none; }
.ex-name { font-weight: 600; }
.ex-sub { color: #6b7280; font-size: 0.9rem; }
.empty { color: #6b7280; margin: 0; }
</style>
