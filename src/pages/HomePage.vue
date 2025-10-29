<template>
  <section class="home">
    <header class="hero">
      <div class="cover" aria-hidden="true"></div>
      <div class="hero-inner">
        <h2 class="headline">Welcome to MuseMe</h2>
        <p class="tagline">Discover, save, and share the best of NYC museums.</p>
      </div>
    </header>

    <HowItWorks />

    <section class="featured">
      <header class="section-head">
        <h3>Trending museums</h3>
        <RouterLink class="link" to="/search">See all</RouterLink>
      </header>
      <ul class="grid">
        <li v-for="m in trending" :key="m.id">
          <MuseumCard :museum-id="m.id" :show-save="isAuthed" @open="openMuseum" />
        </li>
      </ul>
      <MuseumDetailsModal v-model="showDetails" :museum-id="selectedMuseumId" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { computed, ref } from 'vue';
import MuseumCard from '../components/MuseumCard.vue';
import { allMuseums } from '../utils/catalog';
import HowItWorks from '../components/common/HowItWorks.vue';
import MuseumDetailsModal from '../components/MuseumDetailsModal.vue';

const auth = useAuthStore();
const { isAuthenticated: isAuthed } = storeToRefs(auth);

// Simple "trending": stable shuffle and take first 6
const trending = computed(() => {
  const seed = 1373; // deterministic shuffle so it doesn't jump around
  const arr = allMuseums.slice();
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 6);
});

const showDetails = ref(false);
const selectedMuseumId = ref<string | null>(null);
function openMuseum(id: string) { selectedMuseumId.value = id; showDetails.value = true; }
</script>

<style scoped>
.home { max-width: 1100px; margin: 0 auto; padding: 0 1rem 2rem; }
.hero { position: relative; border-radius: 16px; overflow: hidden; border: 1px solid #eee; background: #fff; }
.cover { height: 180px; background: linear-gradient(120deg, rgba(90,15,27,0.98) 0%, rgba(45,95,93,0.92) 60%, rgba(201,169,97,0.6) 100%); position: relative; }
.cover::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: linear-gradient(90deg, #7A5A00 0%, #D7AE2B 28%, #FFE9A9 52%, #D7AE2B 75%, #6E5100 100%); }
.hero-inner { padding: 1.25rem; display: grid; gap: 0.75rem; }
.headline { margin: 0; font-size: 2rem; letter-spacing: 0.2px; }
.tagline { color: #4b5563; margin: 0; font-size: 1.05rem; }
.btn { padding: 0.55rem 0.9rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; text-decoration: none; color: inherit; }
.btn.primary { background: #eef2ff; border-color: #c7d2fe; }
.btn.ghost { background: #fafafa; }
.btn:hover { filter: brightness(0.98); }

.featured { margin-top: 1rem; display: grid; gap: 0.5rem; }
.section-head { display: flex; align-items: center; justify-content: space-between; }
.section-head h3 { margin: 0; font-size: 1.1rem; }
.section-head .link { color: var(--brand-600); text-decoration: none; font-size: 0.95rem; }
.grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }

/* how-it-works styles moved into the component */
</style>
