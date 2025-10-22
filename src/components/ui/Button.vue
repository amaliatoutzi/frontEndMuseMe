<template>
  <component
    :is="as || 'button'"
    :class="classes"
    v-bind="attrs"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';

const props = defineProps<{
  variant?: 'primary' | 'ghost' | 'outline';
  as?: string;
  class?: string;
}>();

const attrs = useAttrs();

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-3 py-2';
  const variant = props.variant || 'primary';
  const map: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500',
    ghost: 'bg-transparent hover:bg-gray-100 border border-gray-200',
    outline: 'border border-gray-300 hover:bg-gray-50',
  };
  return [base, map[variant], props.class].filter(Boolean).join(' ');
});
</script>
