<template>
  <div>
    <h3>My Reviews</h3>
    <ul>
      <li v-for="r in reviews" :key="r._id" class="review">
        <div class="title">
          <strong>{{ nameFor(r.item) }}</strong>
          <span class="stars">{{ '★'.repeat(r.stars) }}{{ '☆'.repeat(Math.max(0, 5 - r.stars)) }}</span>
        </div>
        <p v-if="r.note" class="note">{{ r.note }}</p>
        <small class="meta">Updated {{ new Date(r.updatedAt).toLocaleString() }}</small>
      </li>
    </ul>
    <p v-if="!loading && !reviews.length">No reviews yet.</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getReviewsByUser, type ReviewDTO } from '../../api/reviewing';
import { itemName } from '../../utils/catalog';

const props = defineProps<{ userId: string }>();
const reviews = ref<ReviewDTO[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

function nameFor(id: string) {
  return itemName(id);
}

async function load() {
  loading.value = true; error.value = null;
  try {
    reviews.value = await getReviewsByUser(props.userId);
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to load reviews';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.review { margin-bottom: 0.75rem; }
.title { display: flex; align-items: center; gap: 0.5rem; }
.stars { color: #f5a623; }
.note { margin: 0.25rem 0; }
.meta { color: #666; }
.error { color: #b00020; margin-top: 0.5rem; }
</style>
