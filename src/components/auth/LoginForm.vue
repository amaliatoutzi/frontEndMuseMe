<template>
  <form class="form" @submit.prevent="onSubmit">
    <label class="field">
      <span class="label">Username</span>
      <input v-model.trim="username" autocomplete="username" required />
    </label>
    <label class="field">
      <span class="label">Password</span>
      <input v-model.trim="password" type="password" autocomplete="current-password" required />
    </label>

    <div class="actions">
      <button type="submit" class="primary" :disabled="loading">{{ loading ? 'Logging in…' : 'Login' }}</button>
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
.form { display: grid; gap: 0.85rem; max-width: 420px; }
.field { display: grid; gap: 0.35rem; }
.label { font-weight: 600; font-size: 0.95rem; }
input { padding: 0.55rem 0.7rem; border: 1px solid var(--border); border-radius: 10px; background: #fff; }
input:focus-visible { outline: 3px solid var(--ring); outline-offset: 1px; }
.actions { margin-top: 0.25rem; }
.actions .primary { border-radius: 10px; }
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
