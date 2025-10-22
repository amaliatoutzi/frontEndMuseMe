<template>
  <div class="container auth-page">
    <h2>Welcome to MuseMe</h2>

    <div class="tabs">
      <button :class="{ active: tab === 'login' }" @click="tab = 'login'">Login</button>
      <button :class="{ active: tab === 'register' }" @click="tab = 'register'">Register</button>
    </div>

    <section class="panel">
      <LoginForm v-if="tab === 'login'" @authed="handleAuthed" />
      <RegisterForm v-else @authed="handleAuthed" />
    </section>
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
.auth-page h2 { margin-top: 0; }
.tabs { display: flex; gap: 0.5rem; margin: 1rem 0; }
.tabs button { padding: 0.5rem 0.75rem; border: 1px solid #ddd; background: #fafafa; }
.tabs button.active { background: #eaeaea; }
.panel { border: 1px solid #eee; border-radius: 8px; padding: 1rem; }
</style>
