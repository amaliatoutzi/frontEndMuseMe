<template>
  <div>
    <button class="help-fab" @click="open = true" aria-label="How it works">
      ?
    </button>
    <Modal v-model="open" title="How it works">
      <HowItWorks />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from './Modal.vue';
import HowItWorks from '../common/HowItWorks.vue';

const open = ref(false);
</script>

<style scoped>
.help-fab {
  position: fixed;
  right: 18px;
  bottom: 18px;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--brand-600);
  font-weight: 700;
  font-size: 22px;
  line-height: 1;
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-1);
  z-index: 40;
  transition: transform var(--dur-normal) var(--ease-standard), box-shadow var(--dur-normal) var(--ease-standard), background var(--dur-quick) var(--ease-standard);
}
.help-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(16,24,40,0.12); background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.help-fab:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }
</style>
