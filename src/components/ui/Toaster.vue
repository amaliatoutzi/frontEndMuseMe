<template>
  <div class="toaster" role="status" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast-slide" tag="div" class="stack">
      <div v-for="t in toast.items" :key="t.id" class="toast" :class="t.kind" role="alert">
        <div class="dot" aria-hidden="true"></div>
        <div class="msg">{{ t.message }}</div>
        <button class="x" @click="toast.dismiss(t.id)" aria-label="Dismiss notification">×</button>
      </div>
    </TransitionGroup>
  </div>

</template>

<script setup lang="ts">
import { useToastStore } from '../../stores/toast';
const toast = useToastStore();
</script>

<style scoped>
.toaster { position: fixed; right: 12px; top: 12px; z-index: 1000; pointer-events: none; }
.stack { display: grid; gap: 8px; }
.toast { pointer-events: auto; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-2, 0 8px 30px rgba(0,0,0,0.12)); color: var(--text); min-width: 240px; }
.toast .msg { font-weight: 600; letter-spacing: 0.1px; }
.toast .x { background: transparent; border: none; color: inherit; font-size: 18px; line-height: 1; width: 28px; height: 28px; border-radius: 6px; display: grid; place-items: center; transition: color var(--dur-quick, 150ms) var(--ease-standard, cubic-bezier(0.2, 0, 0, 1)); }
.toast .x:hover { color: var(--accent-gold); }
.toast .dot { width: 8px; height: 8px; border-radius: 999px; }
.toast.success { border-color: #d1fae5; background: #ecfdf5; color: #065f46; }
.toast.success .dot { background: #10b981; }
.toast.error { border-color: #fee2e2; background: #fef2f2; color: #991b1b; }
.toast.error .dot { background: #ef4444; }
.toast.info { border-color: #e5e7eb; background: #f9fafb; color: #111827; }
.toast.info .dot { background: #6b7280; }

/* Animations */
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 200ms var(--ease-standard, cubic-bezier(0.2, 0, 0, 1)); }
.toast-slide-enter-from { opacity: 0; transform: translateY(-6px); }
.toast-slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
