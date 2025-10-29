<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click.self="close" role="dialog" :aria-label="title || 'Dialog'" aria-modal="true">
      <div class="modal-panel" ref="panel" @keydown.esc.prevent.stop="close" tabindex="-1">
        <header v-if="title" class="modal-head">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="icon-btn" @click="close" aria-label="Close dialog">×</button>
        </header>
        <div class="modal-body">
          <slot />
        </div>
        <footer class="modal-foot">
          <slot name="actions">
            <button class="btn" @click="close">Close</button>
          </slot>
        </footer>
      </div>
    </div>
  </Teleport>

</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps<{ modelValue: boolean; title?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const panel = ref<HTMLElement | null>(null);

function close() { emit('update:modelValue', false); }

watch(() => props.modelValue, async (open) => {
  if (open) await nextTick().then(() => panel.value?.focus());
});

onMounted(() => {
  if (props.modelValue) panel.value?.focus();
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: grid; place-items: center; z-index: 50;
  padding: 1rem;
}
.modal-panel {
  width: 100%; max-width: 480px; background: #fff; border-radius: 12px;
  border: 1px solid #e5e7eb; box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  outline: none;
}
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; }
.modal-title { margin: 0; font-size: 1.05rem; }
.icon-btn { background: transparent; border: none; font-size: 1.25rem; line-height: 1; cursor: pointer; color: #374151; transition: color var(--dur-quick) var(--ease-standard); }
.icon-btn:hover { color: var(--accent-gold); }
.modal-body { padding: 1rem; }
.modal-foot { padding: 0.75rem 1rem; border-top: 1px solid #eee; display: flex; gap: 0.5rem; justify-content: flex-end; }
.btn { padding: 0.45rem 0.8rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard); }
.btn:hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.btn.primary { background: #111827; color: #fff; border-color: #111827; }
.btn.danger { background: #fee2e2; border-color: #fecaca; }
</style>
