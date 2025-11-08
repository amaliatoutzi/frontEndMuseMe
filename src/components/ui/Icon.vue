<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    :stroke="filled ? 'none' : 'currentColor'"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="icon"
  >
    <!-- Minimal inline library of commonly used icons (Heroicons-inspired) -->
    <template v-if="name === 'refresh'">
      <path d="M4 4v6h6"/>
      <path d="M20 20v-6h-6"/>
      <path d="M20 10a8 8 0 0 0-14.906-3"/>
      <path d="M4 14a8 8 0 0 0 14.906 3"/>
    </template>
    <template v-else-if="name === 'globe'">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/>
      <path d="M2.5 12h19"/>
      <path d="M12 2.5c3.5 3.5 3.5 15.5 0 19"/>
      <path d="M12 2.5c-3.5 3.5-3.5 15.5 0 19"/>
    </template>
    <template v-else-if="name === 'bookmark'">
      <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-3-6 3V4z"/>
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7"/>
      <path d="M21 21l-4.35-4.35"/>
    </template>
    <template v-else-if="name === 'map-pin'">
      <path d="M12 22s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10z"/>
      <circle cx="12" cy="12" r="2.5"/>
    </template>
    <template v-else-if="name === 'preferences'">
      <path d="M4 6h16"/>
      <path d="M7 6v6"/>
      <path d="M7 12h10"/>
      <path d="M17 12v6"/>
      <path d="M4 18h16"/>
    </template>
    <template v-else-if="name === 'saved'">
      <path d="M5 5h14v14l-7-3-7 3V5z"/>
    </template>
    <template v-else-if="name === 'reviews'">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </template>
    <template v-else-if="name === 'edit'">
      <path d="M4 20h4l10-10-4-4L4 16v4z"/>
      <path d="M14 6l4 4"/>
    </template>
    <template v-else-if="name === 'camera'">
      <rect x="3" y="6" width="18" height="14" rx="2"/>
      <path d="M9 6l2-2h2l2 2"/>
      <circle cx="12" cy="13" r="4"/>
    </template>
    <template v-else-if="name === 'palette'">
      <path d="M12 3a9 9 0 1 0 0 18h1a3 3 0 0 0 0-6h-1a1 1 0 0 1-1-1 2 2 0 0 1 2-2h1a3 3 0 0 0 0-6h-2z"/>
    </template>
    <template v-else-if="name === 'museum'">
      <path d="M3 10h18"/>
      <path d="M6 10v8"/>
      <path d="M10 10v8"/>
      <path d="M14 10v8"/>
      <path d="M18 10v8"/>
      <path d="M4 20h16"/>
      <path d="M12 4 3 8h18L12 4z"/>
    </template>
    <template v-else-if="name === 'star'">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </template>
    <template v-else-if="name === 'sculpture'">
      <!-- Simple statue on a pedestal: head, torso, base -->
      <circle cx="12" cy="7" r="3"/>
      <path d="M9 11h6l1 4H8l1-4z"/>
      <rect x="7" y="16" width="10" height="4" rx="1"/>
      <path d="M6 21h12"/>
    </template>
    <template v-else-if="name === 'arrow-up'">
      <path d="M12 19V5"/>
      <path d="M5 12l7-7 7 7"/>
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  name:
    | 'refresh'
    | 'search'
    | 'globe'
    | 'bookmark'
    | 'map-pin'
    | 'preferences'
    | 'saved'
    | 'reviews'
    | 'edit'
    | 'camera'
    | 'palette'
    | 'museum'
    | 'star'
    | 'sculpture'
    | 'arrow-up';
  size?: number | string;
  stroke?: number | string;
  filled?: boolean;
}>();

const size = props.size ?? 18;
const stroke = props.stroke ?? 2;
// Keep 'filled' reactive to prop changes
const filled = computed(() => props.filled ?? false);
</script>

<style scoped>
.icon { display: inline-block; vertical-align: middle; }
</style>
