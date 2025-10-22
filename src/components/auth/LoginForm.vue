<template>
  <form class="form" @submit.prevent="onSubmit">
    <label>
      Username
      <input v-model.trim="username" autocomplete="username" required />
    </label>
    <label>
      Password
      <input v-model.trim="password" type="password" autocomplete="current-password" required />
    </label>

    <div class="actions">
      <button type="submit" :disabled="loading">{{ loading ? 'Logging in…' : 'Login' }}</button>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const { loading } = storeToRefs(auth);
const username = ref('');
const password = ref('');
const localError = ref<string | null>(null);

const errorMessage = computed(() => localError.value || auth.error);

async function onSubmit() {
  if (!username.value || !password.value) return;
  localError.value = null;
  auth.clearError();

  try {
    await auth.login(username.value, password.value);
    emit('authed');
  } catch (err: any) {
    // Set local error as fallback
    localError.value = err?.response?.data?.error || auth.error || 'Login failed. Please check your credentials.';
    console.error('Login failed:', err);
  }
}

const emit = defineEmits<{ (e: 'authed'): void }>();
</script>

<style scoped>
.form { display: grid; gap: 0.75rem; max-width: 360px; }
label { display: grid; gap: 0.25rem; }
input { padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
.actions { margin-top: 0.5rem; }
.actions button { padding: 0.45rem 0.8rem; border: 1px solid var(--border); background: #fafafa; border-radius: 8px; transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease; }
.actions button:hover { background: var(--brand-600); color: #fff; border-color: var(--brand-600); }
.actions button:disabled { opacity: 0.6; cursor: not-allowed; }
.error {
  color: #b00020;
  background: #fce4ec;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #b00020;
  margin: 0;
}
</style>
