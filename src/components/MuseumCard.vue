<template>
  <article v-if="museum" :class="['museum-card', variant === 'burgundy' ? 'burgundy' : '']" @click="onOpen">
    <div v-if="museum.pictureUrl" class="media frame">
      <img :src="museum.pictureUrl" :alt="museum.name + ' photo'" loading="lazy" class="fade-in-img" @load="onImgLoad" />
    </div>
    <h3 class="title">{{ museum.name }}</h3>
    <p class="meta">
      <span v-if="museum.borough">{{ museum.borough }}</span>
      <span v-if="museum.address"> • {{ museum.address }}</span>
      <span v-if="museum.zip"> • {{ museum.zip }}</span>
    </p>
    <p class="tags" v-if="museum.tags?.length">
      <span v-for="t in museum.tags" :key="t" class="tag">{{ formatTag(t) }}</span>
    </p>
  <div class="row" @click.stop>
      <p class="link" v-if="museum.website">
        <a :href="museum.website" target="_blank" rel="noopener" class="icon-link" aria-label="Website" title="Website">
          <Icon name="globe" :size="18" />
        </a>
      </p>
      <p class="link">
        <a :href="mapUrl" target="_blank" rel="noopener" class="icon-link" aria-label="Directions" title="Directions">
          <Icon name="map-pin" :size="18" />
        </a>
      </p>
      <button
        v-if="showSave"
        class="bookmark-btn"
        :disabled="!userId"
        @click="toggleSave"
        :title="!userId ? 'Login to save' : (isSaved(museum.id) ? 'Unsave' : 'Save')"
        :aria-pressed="isSaved(museum.id) ? 'true' : 'false'"
        aria-label="Bookmark"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          :fill="isSaved(museum.id) ? 'currentColor' : 'none'"
          :stroke="isSaved(museum.id) ? 'none' : 'currentColor'"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M6 2h12a2 2 0 0 1 2 2v16l-8-4-8 4V4a2 2 0 0 1 2-2z" />
        </svg>
      </button>
    </div>
  </article>
  <article v-else class="museum-card">
    <h3 class="title">Unknown museum</h3>
    <p class="meta">ID: {{ museumId }}</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getMuseumById, type Museum } from '../utils/catalog';
import { useAuthStore } from '../stores/auth';
import { useSavingStore } from '../stores/saving';
import { storeToRefs } from 'pinia';
import Icon from './ui/Icon.vue';

const emit = defineEmits<{ (e: 'open', museumId: string): void }>();
const props = withDefaults(defineProps<{ museumId: string; showSave?: boolean; variant?: 'default' | 'burgundy' }>(), {
  variant: 'default'
});
const museum = computed<Museum | undefined>(() => getMuseumById(props.museumId));

function formatTag(tag: string): string {
  return tag.replace(/([a-z])([A-Z])/g, '$1 $2');
}

const mapUrl = computed(() => {
  const m = museum.value;
  if (!m) return '#';
  const parts = [m.address || m.name, m.borough, 'New York, NY', m.zip].filter(Boolean) as string[];
  const dest = encodeURIComponent(parts.join(', '));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
});

function onImgLoad(e: Event) {
  const img = e.target as HTMLImageElement;
  if (!img) return;
  img.classList.add('is-loaded');
}

function onOpen() {
  emit('open', props.museumId);
}

// Saving integration
const auth = useAuthStore();
const { currentUserId: userId } = storeToRefs(auth);
const saving = useSavingStore();

function isSaved(itemId: string): boolean {
  return userId.value ? saving.isSaved(userId.value, itemId) : false;
}

async function toggleSave() {
  if (!userId.value || !museum.value) return;
  const id = museum.value.id;
  if (isSaved(id)) {
    try {
      await saving.unsave(userId.value, id);
    } catch (e: any) {
      alert(e?.message || 'Failed to unsave');
    }
  } else {
    try {
      await saving.save(userId.value, id);
    } catch (e: any) {
      alert(e?.message || 'Failed to save');
    }
  }
}
</script>

<style scoped>
.museum-card {
  border: 1px solid #e6e0d6;
  border-radius: 10px;
  padding: 0.75rem;
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform var(--dur-normal) var(--ease-standard), box-shadow var(--dur-normal) var(--ease-standard), border-color var(--dur-normal) var(--ease-standard);
  position: relative;
  overflow: hidden;
}
.museum-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #7A5A00 0%, #D7AE2B 28%, #FFE9A9 52%, #D7AE2B 75%, #6E5100 100%);
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  z-index: 1;
}
.museum-card.burgundy::before { display: none; }
.museum-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-1);
  border-color: var(--border);
}
.museum-card.burgundy {
  background: var(--brand-600);
  color: #fff;
  border-color: var(--brand-600);
}
.museum-card.burgundy .title { color: #fff; }
.museum-card.burgundy .meta { color: rgba(255,255,255,0.85); }
.museum-card.burgundy .tag { color: #fff; background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); }
.museum-card.burgundy .icon-link { background: transparent; border-color: rgba(255,255,255,0.45); color: #fff; }
.museum-card.burgundy .icon-link:hover { background: var(--accent-gold); border-color: var(--accent-gold); color: #fff; }
.museum-card.burgundy .bookmark-btn { background: transparent; border-color: rgba(255,255,255,0.45); color: #fff; }
.museum-card.burgundy .bookmark-btn:hover { background: var(--accent-gold); border-color: var(--accent-gold); color: #fff; }
.media { margin: -0.75rem -0.75rem 0.5rem; height: 200px; overflow: hidden; border-top-left-radius: 10px; border-top-right-radius: 10px; background: var(--paper); }
.media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.title {
  margin: 0 0 0.25rem 0;
  font-size: 1.05rem;
  font-family: 'Playfair Display', Georgia, 'Times New Roman', Times, serif;
  letter-spacing: 0.2px;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.4em; /* 2 lines */
}
.meta {
  margin: 0 0 0.5rem 0;
  color: #4a4a4a;
  min-height: 1.2em;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  max-height: 1.6em; /* ~1 line height */
  overflow: hidden;
}
.tag { font-size: 0.75rem; padding: 0.1rem 0.4rem; border: 1px solid #e6e0d6; border-radius: 999px; color: #444; background: #fffdf9; }
.link a { color: var(--brand-600); text-decoration: none; }
.link a:hover { text-decoration: underline; }
.link + .link { margin-left: 0.5rem; }
.icon-link { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; background: #fff; border: 1px solid var(--border); transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard), transform var(--dur-normal) var(--ease-standard); }
.icon-link:hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.row { display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem; }
.bookmark-btn {
  display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px;
  border: 1px solid var(--border); background: #fff; color: var(--brand-600); border-radius: 6px; transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard);
}
.bookmark-btn:hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.bookmark-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
