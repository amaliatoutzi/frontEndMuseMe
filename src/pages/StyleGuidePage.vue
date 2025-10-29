<template>
  <section class="style-guide">
    <h2>Style Guide</h2>

    <section class="block">
      <h3>Buttons</h3>
      <div class="row">
        <button class="primary">Primary</button>
        <button class="ghost">Ghost</button>
        <a href="#" class="icon-link" aria-label="Icon link">🌐</a>
      </div>
    </section>

    <section class="block">
      <h3>Tags & Chips</h3>
      <div class="row">
        <span class="tag">Contemporary Art</span>
        <span class="tag">Family Friendly</span>
        <span class="tag">Photography</span>
      </div>
    </section>

    <section class="block">
      <h3>Cards</h3>
      <div class="row cards">
        <div class="card" style="padding: 0.75rem; min-width: 220px;">
          <strong>Card Title</strong>
          <p class="muted">Uses surface, border, and shadow tokens</p>
          <GoldDivider :height="56" :stroke="12" :ornament-stroke="10" style="margin: 0.5rem 0;" />
          <button class="primary">Action</button>
        </div>
        <div style="display: grid; gap: 0.5rem;">
          <small class="muted">MuseumCard (default)</small>
          <MuseumCard v-if="sampleId" :museum-id="sampleId" variant="default" style="max-width: 280px;" />
        </div>
        <div style="display: grid; gap: 0.5rem;">
          <small class="muted">MuseumCard (burgundy)</small>
          <MuseumCard v-if="sampleId" :museum-id="sampleId" variant="burgundy" style="max-width: 280px;" />
        </div>
      </div>
    </section>

    <section class="block">
      <h3>Links & Badges</h3>
      <div class="row">
        <a href="#">Brand link</a>
        <span class="badge-gold" title="Gold badge"></span>
      </div>
    </section>

    <section class="block">
      <h3>Banners</h3>
      <div class="col">
        <p class="banner">This is a neutral banner.</p>
        <p class="banner info">This is an info banner with burgundy accent.</p>
        <p class="banner empty">This is an empty-state banner with gold accent.</p>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { allMuseums } from '../utils/catalog';
import MuseumCard from '../components/MuseumCard.vue';
import GoldDivider from '../components/ui/GoldDivider.vue';

const sampleId = ref<string | null>(null);
onMounted(() => {
  const m = allMuseums?.[0];
  sampleId.value = m?.id || null;
});
</script>

<style scoped>
.style-guide { max-width: 900px; margin: 0 auto; padding: 0 1rem; display: grid; gap: 1rem; }
.block { display: grid; gap: 0.5rem; }
.row { display: inline-flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.col { display: grid; gap: 0.5rem; }
.muted { color: var(--muted); }
</style>
