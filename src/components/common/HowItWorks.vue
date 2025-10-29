<template>
  <section class="how">
    <h3>How it works</h3>
    <ul class="steps">
      <li>
        <div class="icon"><Icon name="search" :size="18" /></div>
        <div>
          <strong>Search</strong>
          <p>Find museums and exhibits that match your vibe.</p>
        </div>
      </li>
      <li>
        <div class="icon"><Icon name="bookmark" :size="18" /></div>
        <div>
          <strong>Save</strong>
          <p>Bookmark places to build your culture list.</p>
        </div>
      </li>
      <li>
        <div class="icon"><Icon name="camera" :size="18" /></div>
        <div>
          <strong>Showcase</strong>
          <p>Log visits with photos and ratings to share with friends.</p>
        </div>
      </li>
      <li>
        <div class="icon"><Icon name="refresh" :size="18" /></div>
        <div>
          <strong>Spotlight</strong>
          <p>Get a curated pick tailored to your tastes—refresh for inspiration.</p>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import Icon from '../ui/Icon.vue';
</script>

<style scoped>
.how { margin-top: 0.5rem; }
.how h3 { margin: 0 0 0.5rem 0; font-size: 1.1rem; color: var(--brand-600); }
/* Responsive grid that adapts to container width (works well in modal and on page) */
.steps { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
.steps li { display: flex; gap: 0.6rem; background: #fff; border: 1px solid var(--brand-100); border-radius: 12px; padding: 0.6rem; align-items: center; }
.steps .icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--brand-50); color: var(--brand-600); border: 1px solid var(--brand-100); }
.steps strong { color: var(--brand-600); }
</style>
