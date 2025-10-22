<template>
  <div class="stars" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="i in 5"
      :key="i"
      class="star"
      type="button"
      :aria-checked="modelValue === i"
      role="radio"
      @click="onSet(i)"
      @keydown.enter.prevent="onSet(i)"
      @keydown.space.prevent="onSet(i)"
    >
      <span :class="{ filled: i <= modelValue }" aria-hidden="true">★</span>
      <span class="sr-only">{{ i }} star{{ i > 1 ? 's' : '' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: number; ariaLabel?: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>();

function onSet(v: number) {
  emit('update:modelValue', v);
}
</script>

<style scoped>
.stars { display: inline-flex; gap: 0.25rem; }
.star { border: none; background: transparent; cursor: pointer; padding: 0; line-height: 1; font-size: 1.25rem; }
.star:focus { outline: 2px solid #c7d2fe; border-radius: 4px; }
.filled { color: #f5b301; }
.sr-only { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
</style>
