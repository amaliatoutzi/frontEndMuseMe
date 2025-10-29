<template>
  <div class="app">
    <header class="app-header">
      <h1 class="logo">
        <RouterLink to="/" class="logo-link" aria-label="MuseMe home">
          <img :src="logoUrl" alt="MuseMe" class="logo-img" />
          <span class="logo-title">MuseMe</span>
        </RouterLink>
      </h1>
      <form class="searchbar" role="search" @submit.prevent="onTopSearch">
        <input v-model.trim="topQuery" type="search" placeholder="Search users, museums, tags…" aria-label="Search" />
      </form>
      <nav class="nav">

        <RouterLink to="/spotlight" class="nav-link" aria-label="Spotlight">
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="13,2 8,14 12,14 11,22 16,10 12,10" />
          </svg>
          <span class="label">Spotlight</span>
        </RouterLink>
        <RouterLink to="/feed" v-if="auth.isAuthenticated" class="nav-link" aria-label="Friends feed">
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="7" cy="8" r="3" />
            <circle cx="17" cy="8" r="3" />
            <path d="M2 20a5 5 0 0 1 10 0" />
            <path d="M12 20a5 5 0 0 1 10 0" />
          </svg>
          <span class="label">Feed</span>
        </RouterLink>
        <RouterLink to="/auth" v-if="!auth.isAuthenticated" class="nav-link" aria-label="Login / Sign up">
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span class="label">Login / Sign up</span>
        </RouterLink>
        <RouterLink to="/showcase" v-if="auth.isAuthenticated" class="nav-link" aria-label="Showcase">
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <polyline points="7,14 10,11 13,13 16,9 20,14" />
          </svg>
          <span class="label">Showcase</span>
        </RouterLink>
        <RouterLink to="/profile" v-if="auth.isAuthenticated" class="nav-link" aria-label="Profile">
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20a8 8 0 0 1 16 0" />
          </svg>
          <span class="label">Profile</span>
        </RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <Transition name="route-fade-slide" mode="out-in">
        <RouterView />
      </Transition>
    </main>
    <HelpButton />
    <MapButton />
    <ScrollTopButton />
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';
import logoUrl from '../media/logo.png';
import HelpButton from './components/ui/HelpButton.vue';
import MapButton from './components/ui/MapButton.vue';
import ScrollTopButton from './components/ui/ScrollTopButton.vue';
import Toaster from './components/ui/Toaster.vue';

const auth = useAuthStore();
const router = useRouter();
const topQuery = ref('');

function onTopSearch() {
  const q = topQuery.value.trim();
  if (!q) return;
  router.push({ name: 'search', query: { q } });
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
}
.logo {
  margin: 0;
  font-size: 1.25rem;
}
.logo-link { display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; color: inherit; }
.logo-img { height: 40px; width: auto; display: block; }
.logo-title { font-weight: 700; letter-spacing: 0.2px; }
.nav {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.searchbar { flex: 1; display: flex; justify-content: center; }
.searchbar input { width: min(520px, 56vw); padding: 0.4rem 0.75rem; border: 1px solid var(--border); border-radius: 999px; background: var(--surface-2); color: var(--text); }
.searchbar input::placeholder { color: var(--muted); }
.searchbar input:focus { outline: 3px solid var(--ring); outline-offset: 2px; border-color: var(--brand-600); background: #fff; }
.nav :deep(a.nav-link) {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  border-radius: 10px;
}
/* Remove old separators for a cleaner, modern look */
.icon { line-height: 1; }
.icon-svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
.nav :deep(a.nav-link:hover) .icon-svg { filter: none; }
.nav :deep(a.nav-link .label) { font-variant-caps: normal; letter-spacing: 0.02em; font-weight: 600; }

/* Modern hover + active pills */
.nav :deep(a.nav-link:hover) { background: var(--surface-2); color: var(--brand-600); }
.nav :deep(a.nav-link.router-link-active),
.nav :deep(a.nav-link.router-link-exact-active) {
  background: var(--brand-600);
  color: #fff;
  box-shadow: 0 4px 12px rgba(124,45,75,0.18);
}
.app-main {
  padding: 1rem;
}
</style>
