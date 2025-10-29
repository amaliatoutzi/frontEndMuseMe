<template>
  <form class="form" @submit.prevent="onSubmit">
    <label class="field">
      <span class="label">Username</span>
      <input v-model.trim="username" autocomplete="username" required />
    </label>
    <div class="grid-2">
      <label class="field">
        <span class="label">First name</span>
        <input v-model.trim="firstName" autocomplete="given-name" required />
      </label>
      <label class="field">
        <span class="label">Last name</span>
        <input v-model.trim="lastName" autocomplete="family-name" required />
      </label>
    </div>
    <label class="field">
      <span class="label">Password</span>
      <input v-model.trim="password" type="password" autocomplete="new-password" required />
    </label>
    <details>
      <summary>Optional: upload a profile picture</summary>
      <input type="file" accept="image/*" @change="onPickFile" />
      <p v-if="previewUrl" class="hint">Preview ready (will be uploaded as part of registration)</p>
    </details>

    <div class="actions">
      <button type="submit" class="primary" :disabled="loading">{{ loading ? 'Registering…' : 'Register' }}</button>
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
const firstName = ref('');
const lastName = ref('');
const password = ref('');
const pickedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const localError = ref<string | null>(null);

const errorMessage = computed(() => localError.value || auth.error);

async function onSubmit() {
  if (!username.value || !password.value || !firstName.value || !lastName.value) return;
  localError.value = null;
  auth.clearError();

  try {
    await auth.register(username.value, password.value);
    // Add immutable name immediately after registration
    try {
      const { useProfileStore } = await import('../../stores/profile');
      const profile = useProfileStore();
      await profile.addName(firstName.value, lastName.value);
      if (pickedFile.value) {
        const url = await fileToDataUrl(pickedFile.value);
        await profile.addProfilePicture(url);
      }
    } catch (e) {
      // Name addition failures should surface but not block navigation
      console.error('Post-register profile setup failed:', e);
      // Provide a friendly local error, but still emit authed so user can proceed
      localError.value = (e as any)?.response?.data?.error || (e as any)?.message || null;
    }
    emit('authed');
  } catch (err: any) {
    // Set local error as fallback
    localError.value = err?.response?.data?.error || auth.error || 'Registration failed. Please try a different username.';
    console.error('Registration failed:', err);
  }
}

const emit = defineEmits<{ (e: 'authed'): void }>();

function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0] || null;
  pickedFile.value = null;
  previewUrl.value = null;
  if (!f) return;
  if (!f.type.startsWith('image/')) {
    localError.value = 'Please choose an image file.';
    return;
  }
  // Build a small preview data URL (resized) for the user and to send to backend
  fileToDataUrl(f, 512).then((url) => {
    previewUrl.value = url;
    pickedFile.value = f;
  }).catch((err) => {
    console.error('Preview failed', err);
    localError.value = 'Could not process image.';
  });
}

async function fileToDataUrl(file: File, maxDim = 512): Promise<string> {
  const buf = await file.arrayBuffer();
  const blobUrl = URL.createObjectURL(new Blob([buf], { type: file.type || 'application/octet-stream' }));
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = blobUrl;
    });
    const { width, height } = img;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, w, h);
    // Prefer JPEG for smaller size unless original is PNG
    const mime = file.type.includes('png') ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mime, 0.9);
    return dataUrl;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
</script>

<style scoped>
.form { display: grid; gap: 0.85rem; max-width: 520px; }
.field { display: grid; gap: 0.35rem; }
.label { font-weight: 600; font-size: 0.95rem; }
input { padding: 0.55rem 0.7rem; border: 1px solid var(--border); border-radius: 10px; background: #fff; }
input:focus-visible { outline: 3px solid var(--ring); outline-offset: 1px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.actions { margin-top: 0.25rem; }
.actions .primary { border-radius: 10px; }
.actions button:disabled { opacity: 0.6; cursor: not-allowed; }
.form details { font-size: 0.9rem; color: #374151; }
.form details summary { cursor: pointer; margin-bottom: 0.25rem; }
.hint { color: #6b7280; margin: 0; font-size: 0.85rem; }
.error {
  color: #b00020;
  background: #fce4ec;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #b00020;
  margin: 0;
}
</style>
