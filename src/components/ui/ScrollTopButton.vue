<template>
  <button v-show="visible" class="scrolltop-fab" @click="scrollTop" aria-label="Scroll to top">
    <Icon name="arrow-up" :size="20" :stroke="2" />
  </button>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import Icon from './Icon.vue';

const visible = ref(false);

function onScroll() {
  // Show after scrolling 320px
  visible.value = (typeof window !== 'undefined') && window.scrollY > 320;
}

function scrollTop() {
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('scroll', onScroll);
});
</script>

<style scoped>
.scrolltop-fab {
  position: fixed;
  right: 18px;
  bottom: 150px; /* stack above Map/Help buttons */
  width: 48px;
  height: 48px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--brand-600);
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-1);
  z-index: 40;
  transition: transform var(--dur-normal) var(--ease-standard), box-shadow var(--dur-normal) var(--ease-standard), background var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard);
}
.scrolltop-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(16,24,40,0.12); background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.scrolltop-fab:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }
</style>
