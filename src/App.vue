<template>
  <div class="app">
    <header class="app-header">
      <h1 class="logo">
        <RouterLink to="/" class="logo-link" aria-label="MuseMe home">
          <img :src="logoUrl" alt="MuseMe" class="logo-img" />
          <span class="logo-title">MuseMe</span>
        </RouterLink>
      </h1>
      <nav class="nav">
        <RouterLink to="/museums" class="nav-link" aria-label="Browse museums">
          <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <span class="label">Browse</span>
        </RouterLink>
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
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth';
import logoUrl from '../media/logo.png';

const auth = useAuthStore();
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
  border-bottom: 1px solid #eee;
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
  gap: 1.25rem;
  align-items: center;
}
.nav :deep(a.nav-link) {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
/* Subtle separators between nav items (skip the first) */
.nav :deep(a.nav-link:not(:first-child)) {
  position: relative;
  padding-left: 0.75rem;
}
.nav :deep(a.nav-link:not(:first-child))::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 18px;
  background: var(--border);
}
.icon { line-height: 1; }
.icon-svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 2; }
.nav :deep(a.nav-link:hover) .icon-svg { filter: drop-shadow(0 0 0.1px currentColor); }
.nav :deep(a.nav-link.router-link-active),
.nav :deep(a.nav-link.router-link-exact-active) {
  color: var(--brand-600);
  background: var(--surface-3);
  padding: 0.35rem 0.5rem;
  border-radius: 10px;
  box-shadow: inset 0 -2px 0 var(--brand-600);
}
.app-main {
  padding: 1rem;
}
</style>
