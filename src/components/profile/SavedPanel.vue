<template>
  <div class="saved-panel">
    <p v-if="!userId">Not authenticated.</p>
    <p v-else-if="loading">Loading…</p>
    <p v-else-if="items.length === 0">No saved museums yet.</p>

    <ul v-else class="list">
      <li v-for="id in items" :key="id" class="row">
        <div class="header">
          <span class="title">{{ name(id) }}</span>
          <div class="actions">
            <button
              class="chevron-btn"
              @click="toggle(id)"
              :aria-expanded="expanded[id] ? 'true' : 'false'"
              :aria-label="expanded[id] ? 'Collapse' : 'Expand'"
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
                :class="{ rotated: expanded[id] }"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <button
              class="bookmark-btn"
              @click.stop="unsave(id)"
              aria-label="Unsave"
              title="Unsave"
              aria-pressed="true"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
                stroke="none"
                aria-hidden="true"
              >
                <path d="M6 2h12a2 2 0 0 1 2 2v16l-8-4-8 4V4a2 2 0 0 1 2-2z" />
              </svg>
            </button>
          </div>
        </div>
        <div v-if="expanded[id]" class="card-wrap">
          <MuseumCard :museum-id="id" />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useSavingStore } from '../../stores/saving';
import { itemName } from '../../utils/catalog';
import MuseumCard from '../../components/MuseumCard.vue';

const props = defineProps<{ userId: string }>();
const saving = useSavingStore();
const loading = ref(false);

const items = computed(() => saving.savedForUser(props.userId));
function name(id: string) { return itemName(id); }
const expanded = ref<Record<string, boolean>>({});
function toggle(id: string) {
  expanded.value[id] = !expanded.value[id];
}

async function refresh() {
  if (!props.userId) return;
  loading.value = true;
  try {
    await saving.syncFromServer(props.userId);
  } finally {
    loading.value = false;
  }
}

async function unsave(id: string) {
  try {
    await saving.unsave(props.userId, id);
  } catch (e: any) {
    alert(e?.message || 'Failed to unsave');
  }
}

onMounted(() => { if (props.userId) refresh(); });
</script>

<style scoped>
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}
.row {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  background: #fff;
}
.header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.title { font-weight: 600; }
.actions { display: flex; align-items: center; gap: 0.5rem; }
.chevron-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 6px;
  border: none; background: transparent; color: inherit;
}
.chevron-btn:hover { background: var(--surface-2); }
.chevron { transition: transform 160ms ease; }
.chevron.rotated { transform: rotate(180deg); }
.card-wrap { margin-top: 0.5rem; }
/* Using global .bookmark-btn for Unsave icon */
</style>
