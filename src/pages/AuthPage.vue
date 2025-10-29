<template>
  <div class="auth-shell">
    <div class="auth-card card">
      <header class="auth-head">
        <h2>Welcome to MuseMe</h2>
        <p class="sub">Sign in or create an account to save, review, and discover curated picks.</p>
      </header>

      <div class="seg-tabs" role="tablist" aria-label="Choose authentication action">
        <button
          class="seg-btn"
          :class="{ active: tab === 'login' }"
          role="tab"
          :aria-selected="tab === 'login' ? 'true' : 'false'"
          @click="tab = 'login'"
        >Login</button>
        <button
          class="seg-btn"
          :class="{ active: tab === 'register' }"
          role="tab"
          :aria-selected="tab === 'register' ? 'true' : 'false'"
          @click="tab = 'register'"
        >Register</button>
      </div>

      <section class="panel">
        <LoginForm v-if="tab === 'login'" @authed="handleAuthed" />
        <RegisterForm v-else @authed="handleAuthed" />
      </section>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import LoginForm from '../components/auth/LoginForm.vue';
import RegisterForm from '../components/auth/RegisterForm.vue';

const tab = ref<'login' | 'register'>('login');
const router = useRouter();

function handleAuthed() {
  // After successful auth, take users to Spotlight instead of Profile
  router.push({ name: 'spotlight' });
}
</script>

<style scoped>
.auth-shell { min-height: calc(100vh - 120px); display: grid; place-items: center; padding: 1.5rem; }
.auth-card { width: min(720px, 96vw); overflow: hidden; }
.auth-head { padding: 1rem; border-bottom: 1px solid var(--border); background:
  linear-gradient(120deg, rgba(124,45,75,0.10) 0%, rgba(45,95,93,0.08) 60%, rgba(201,169,97,0.08) 100%);
}
.auth-head h2 { margin: 0; font-size: 1.6rem; }
.auth-head .sub { margin: 0.25rem 0 0 0; color: var(--muted); }

.seg-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem; background: var(--surface); padding: 0.35rem; border-bottom: 1px solid var(--border); }
.seg-btn {
  padding: 0.5rem 0.75rem; border: 1px solid var(--border); background: var(--surface);
  border-radius: 10px; font-weight: 600; transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard);
}
.seg-btn:hover { background: var(--surface-2); }
.seg-btn.active { background: var(--brand-600); color: #fff; border-color: var(--brand-600); }

.panel { padding: 1rem; }
</style>
