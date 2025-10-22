<template>
  <section class="home">
    <header class="hero">
      <div class="cover" aria-hidden="true"></div>
      <div class="hero-inner">
        <h2 class="headline">Welcome to MuseMe</h2>
        <p class="tagline">Discover, save, and revisit New York City's best museums—curated just for you.</p>
        <div class="cta">
          <RouterLink class="btn primary" to="/museums">Browse museums</RouterLink>
          <RouterLink class="btn" to="/spotlight">Spotlight for you</RouterLink>
          <RouterLink v-if="!isAuthed" class="btn ghost" to="/auth">Login / Sign up</RouterLink>
          <RouterLink v-else class="btn ghost" to="/profile">Your profile</RouterLink>
        </div>
      </div>
    </header>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const { isAuthenticated: isAuthed } = storeToRefs(auth);
</script>

<style scoped>
.home { max-width: 1100px; margin: 0 auto; padding: 0 1rem 2rem; }
.hero { position: relative; border-radius: 16px; overflow: hidden; border: 1px solid #eee; background: #fff; }
.cover { height: 180px; background: linear-gradient(120deg, #dbeafe 0%, #f5f3ff 100%); }
.hero-inner { padding: 1.25rem; display: grid; gap: 0.5rem; }
.headline { margin: 0; font-size: 2rem; letter-spacing: 0.2px; }
.tagline { color: #4b5563; margin: 0; font-size: 1.05rem; }
.cta { margin-top: 0.75rem; display: inline-flex; gap: 0.5rem; flex-wrap: wrap; }
.btn { padding: 0.55rem 0.9rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; text-decoration: none; color: inherit; }
.btn.primary { background: #eef2ff; border-color: #c7d2fe; }
.btn.ghost { background: #fafafa; }
.btn:hover { filter: brightness(0.98); }
</style>
