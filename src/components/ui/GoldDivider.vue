<template>
  <div class="w-full" :style="{ height: height + 'px', width: widthCss }">
    <svg
      viewBox="0 0 1600 200"
      preserveAspectRatio="none"
      class="w-full h-full block"
      role="img"
      aria-label="Decorative Greek gold divider"
    >
      <defs>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stop-color="#7A5A00"/>
          <stop offset="28%" stop-color="#D7AE2B"/>
          <stop offset="52%" stop-color="#FFE9A9"/>
          <stop offset="75%" stop-color="#D7AE2B"/>
          <stop offset="100%" stop-color="#6E5100"/>
        </linearGradient>

        <filter id="gold-emboss" x="-10%" y="-50%" width="120%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-opacity="0.4" />
          <feGaussianBlur stdDeviation="0.25" result="b"/>
          <feSpecularLighting in="b" surfaceScale="2" specularConstant="0.8" specularExponent="20" lighting-color="#fff">
            <feDistantLight azimuth="235" elevation="45" />
          </feSpecularLighting>
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>

        <filter id="soft-glow" x="-20%" y="-120%" width="140%" height="340%">
          <feGaussianBlur stdDeviation="6" result="g"/>
          <feMerge>
            <feMergeNode in="g"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <path
        d="M 0 120
           C 160 50, 300 50, 460 120
           S 760 190, 920 120
           S 1180 50, 1340 120
           S 1500 190, 1600 120"
        fill="none"
        :stroke="`url(#gold-grad)`"
        :stroke-width="stroke"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#soft-glow)"
      />

      <g transform="translate(360, 20) scale(1)">
        <path
          d="M 0 85 h 60 v -40 h 40 v 60 h -60 v 40"
          fill="none"
          :stroke="`url(#gold-grad)`"
          :stroke-width="ornamentStroke"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#gold-emboss)"
        />
        <path
          d="M 140 85
             m -50,0
             a 50 50 0 1 0 100 0
             a 50 50 0 1 0 -100 0
             m 25,0
             a 25 25 0 1 1 50 0
             a 25 25 0 1 1 -50 0"
          fill="none"
          :stroke="`url(#gold-grad)`"
          :stroke-width="ornamentStroke"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#gold-emboss)"
        />
      </g>

      <path
        d="M 1540 125
           c 25 0 45 20 45 45
           c 0 25 -20 45 -45 45
           c -25 0 -45 -20 -45 -45
           c 0 -20 13 -37 32 -43"
        fill="none"
        :stroke="`url(#gold-grad)`"
        :stroke-width="ornamentStroke"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#gold-emboss)"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Props {
  /** Visual band height in px */
  height?: number;
  /** Main line thickness */
  stroke?: number;
  /** Ornament stroke thickness */
  ornamentStroke?: number;
  /** Explicit CSS width (e.g., 200, '18ch', '240px', '50%'). If provided, overrides matchTo. */
  width?: number | string;
  /** CSS selector to measure and match width to (e.g., '#spotlight-title'). */
  matchTo?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: 80,
  stroke: 10,
  ornamentStroke: 8,
  width: undefined,
  matchTo: undefined,
});

const measured = ref<number | null>(null);
let ro: ResizeObserver | null = null;

function setupObserver() {
  cleanupObserver();
  if (!props.matchTo || typeof window === 'undefined') return;
  const el = document.querySelector(props.matchTo) as HTMLElement | null;
  if (!el) return;
  const update = () => { measured.value = el.getBoundingClientRect().width; };
  update();
  ro = new ResizeObserver(() => update());
  ro.observe(el);
}

function cleanupObserver() {
  if (ro) { try { ro.disconnect(); } catch {} ro = null; }
}

onMounted(setupObserver);
onBeforeUnmount(cleanupObserver);
watch(() => props.matchTo, () => setupObserver());

const widthCss = computed(() => {
  if (props.width != null) {
    return typeof props.width === 'number' ? `${props.width}px` : String(props.width);
  }
  if (measured.value != null) return `${Math.max(0, measured.value)}px`;
  return '100%';
});
</script>

<style scoped>
:host, .w-full { display: block; }
</style>
