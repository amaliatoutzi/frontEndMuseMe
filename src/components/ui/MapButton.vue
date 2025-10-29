<template>
  <div>
    <button class="map-fab" @click="open = true" aria-label="Open map">
      <Icon name="map-pin" :size="22" :stroke="2" />
    </button>
    <Modal v-model="open" title="Map">
      <MuseumMap :museums="museums" height="70vh" @open="onOpen" />
      <MuseumDetailsModal v-model="showDetails" :museum-id="selectedId" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from './Modal.vue';
import MuseumMap from '../common/MuseumMap.vue';
import MuseumDetailsModal from '../../components/MuseumDetailsModal.vue';
import { allMuseums } from '../../utils/catalog';
import Icon from './Icon.vue';

const open = ref(false);
const showDetails = ref(false);
const selectedId = ref<string | null>(null);
const museums = allMuseums;

function onOpen(id: string) {
  selectedId.value = id;
  showDetails.value = true;
}
</script>

<style scoped>
.map-fab {
  position: fixed;
  right: 18px;
  bottom: 84px; /* stack above help button */
  width: 52px;
  height: 52px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--brand-600);
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-1);
  z-index: 40;
  transition: transform var(--dur-normal) var(--ease-standard), box-shadow var(--dur-normal) var(--ease-standard), background var(--dur-quick) var(--ease-standard);
}
.map-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(16,24,40,0.12); background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.map-fab .icon { width: 22px; height: 22px; }
</style>
