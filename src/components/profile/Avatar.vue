<template>
  <div class="avatar" :style="{ width: sizePx, height: sizePx, fontSize: fontSize }" :aria-label="aria">
    <img v-if="url" :src="url" :alt="aria" @error="onImgError" />
    <span v-else aria-hidden="true">{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  url?: string | null;
  size?: number; // px
}>();

const sizePx = computed(() => `${props.size ?? 72}px`);
const fontSize = computed(() => `${Math.max(12, Math.floor((props.size ?? 72) * 0.36))}px`);

function toInitials(first?: string | null, last?: string | null, username?: string | null) {
  const f = (first?.trim()?.[0] || '').toUpperCase();
  const l = (last?.trim()?.[0] || '').toUpperCase();
  const fromName = `${f}${l}`.trim();
  if (fromName) return fromName;
  const u = username?.trim()?.[0]?.toUpperCase();
  return u || '?';
}

const initials = computed(() => toInitials(props.firstName, props.lastName, props.username));
const aria = computed(() => {
  const full = [props.firstName, props.lastName].filter(Boolean).join(' ');
  return full || (props.username ? `@${props.username}` : 'User');
});

const imageUrl = ref<string | null>(props.url || null);
watch(() => props.url, (v) => { imageUrl.value = v || null; });

function onImgError() {
  // If the provided URL fails, fall back to initials for this render
  imageUrl.value = null;
}

const url = computed(() => imageUrl.value || null);
</script>

<style scoped>
.avatar {
  border-radius: 999px;
  background: var(--brand-600);
  color: #fff;
  display: grid;
  place-items: center;
  overflow: hidden;
  transition: transform var(--dur-normal) var(--ease-standard), filter var(--dur-quick) var(--ease-standard);
}
.avatar:hover { transform: translateY(-1px); filter: saturate(1.02); }
.avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar span { font-weight: 700; letter-spacing: 0.5px; }
</style>
