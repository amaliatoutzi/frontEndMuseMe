<template>
  <article v-if="museum" class="museum-card">
    <div v-if="museum.pictureUrl" class="media">
      <img :src="museum.pictureUrl" :alt="museum.name + ' photo'" loading="lazy" />
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
    <p class="link" v-if="museum.website">
      <a :href="museum.website" target="_blank" rel="noopener">Website</a>
    </p>
    <p class="link">
      <a :href="mapUrl" target="_blank" rel="noopener" class="icon-link" aria-label="Directions" title="Directions">📍</a>
    </p>
  </article>
  <article v-else class="museum-card">
    <h3 class="title">Unknown museum</h3>
    <p class="meta">ID: {{ museumId }}</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getMuseumById, type Museum } from '../utils/catalog';

const props = defineProps<{ museumId: string }>();
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
</script>

<style scoped>
.museum-card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 0.75rem;
  background: #fff;
}
.media { margin: -0.75rem -0.75rem 0.5rem; height: 180px; overflow: hidden; border-top-left-radius: 10px; border-top-right-radius: 10px; background: #f3f4f6; }
.media img { width: 100%; height: 100%; object-fit: cover; display: block; }
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
.icon-link { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; background: #f3f4f6; }
.icon-link:hover { background: #e5e7eb; }
</style>
