<template>
  <div>
    <h3>Preferences</h3>
    <p class="explain">Add a few tags to personalize your recommendations and Spotlight picks.</p>
    <div class="prefs">
      <div>
  <h4>My Tags ({{ myTags.length }})</h4>
        <ul>
          <li v-for="t in myTags" :key="t">
            {{ t }}
            <button class="link" @click="remove(t)" :disabled="busy">remove</button>
          </li>
        </ul>
      </div>
      <div>
        <h4>Add Tag</h4>
        <div class="chips">
          <button v-for="t in availableToAdd" :key="t" class="chip" @click="add(t)" :disabled="busy">
            + {{ t }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="success" class="success">{{ success }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { addPreference, removePreference } from '../../api/userPreferences';
import { usePreferencesStore } from '../../stores/preferences';

const props = defineProps<{ userId: string }>();
const prefsStore = usePreferencesStore();
const myTags = computed(() => prefsStore.tagsForUser(props.userId));
const busy = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

// Preset tags
const TAGS = [
  'Art', 'Contemporary', 'Modern', 'Classical', 'Sculpture', 'Photography', 'Design', 'History', 'Science',
  'Children', 'NaturalHistory', 'Technology', 'Maritime', 'Immigration', 'AfricanAmerican', 'Asian',
  'Hispanic', 'American', 'Aviation', 'Transit', 'PerformingArts', 'Film', 'Architecture', 'Literature'
];

const availableToAdd = computed(() => TAGS.filter(t => !myTags.value.includes(t)));

async function load() {
  error.value = null;
  // Merge from server without losing locally stored tags
  await prefsStore.syncFromServer(props.userId);
}

async function add(tag: string) {
  if (myTags.value.includes(tag)) {
    success.value = null;
    error.value = 'Tag already added';
    return;
  }
  busy.value = true; error.value = null; success.value = null;
  try {
    // Optimistic local persistence first
    prefsStore.addTag(props.userId, tag);
    // Fire-and-forget server call
    await addPreference(props.userId, tag);
    success.value = `Added: ${tag}`;
    // Do not refresh from server here to avoid losing prior optimistic tags
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to add tag';
    // Rollback local add if server definitively failed
    prefsStore.removeTag(props.userId, tag);
  } finally {
    busy.value = false;
    if (success.value) setTimeout(() => (success.value = null), 1500);
  }
}

async function remove(tag: string) {
  busy.value = true; error.value = null; success.value = null;
  // Optimistic remove with local persistence
  const hadTag = myTags.value.includes(tag);
  if (hadTag) prefsStore.removeTag(props.userId, tag);
  try {
    await removePreference(props.userId, tag);
  // Show removal as red with background per request
  error.value = `Removed: ${tag}`;
    // No server refresh; keep optimistic state
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to remove tag';
    // rollback
    if (hadTag) prefsStore.addTag(props.userId, tag);
  } finally {
    busy.value = false;
    // Auto-clear transient messages
    if (success.value) setTimeout(() => (success.value = null), 1500);
    // If removal succeeded, error contains our red message; clear it after a beat
    if (error.value && error.value.startsWith('Removed: ')) {
      setTimeout(() => { if (error.value?.startsWith('Removed: ')) error.value = null; }, 1500);
    }
  }
}

onMounted(load);
</script>

<style scoped>
.prefs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.explain { color: var(--muted); margin: 0.25rem 0 0.75rem; }
.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chip { padding: 0.25rem 0.5rem; border: 1px solid var(--border); border-radius: 999px; background: var(--surface-2); color: var(--text); transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease; }
.chip:hover { background: var(--brand-600); color: #fff; border-color: var(--brand-600); }
.link { background: transparent; border: none; color: var(--brand-600); cursor: pointer; }
.link:hover { text-decoration: underline; }
.success { color: #176617; background: #eef7ee; padding: 0.5rem; border-radius: 6px; margin-top: 0.5rem; }
.error { color: #b00020; background: #fee2e2; padding: 0.5rem; border-radius: 6px; margin-top: 0.5rem; }
</style>
