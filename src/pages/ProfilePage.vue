<template>
  <section class="profile-page">
    <div v-if="!userId" class="not-auth">Not authenticated.</div>
    <div v-else class="profile-wrap">
      <!-- Social-style hero -->
      <header class="hero">
        <div class="cover" :style="coverStyle" aria-hidden="true"></div>
        <div class="hero-inner">
          <h2 class="name">{{ username }}</h2>
          <div class="hero-actions">
            <button class="btn danger" @click="logout">Logout</button>
          </div>
        </div>
      </header>

      <!-- Tabs -->
      <nav class="tabs" aria-label="Profile sections">
        <button class="tab" :class="{ active: tab === 'following' }" @click="tab = 'following'" :aria-current="tab === 'following' ? 'page' : undefined">Following</button>
        <button class="tab" :class="{ active: tab === 'preferences' }" @click="tab = 'preferences'" :aria-current="tab === 'preferences' ? 'page' : undefined">Preferences</button>
        <button class="tab" :class="{ active: tab === 'saved' }" @click="tab = 'saved'" :aria-current="tab === 'saved' ? 'page' : undefined">Saved</button>
        <button class="tab" :class="{ active: tab === 'reviews' }" @click="tab = 'reviews'" :aria-current="tab === 'reviews' ? 'page' : undefined">Reviews</button>
      </nav>

      <!-- Content panel -->
      <section class="panel">
        <FollowingPanel v-if="tab === 'following'" :user-id="userId!" :username="username || ''" />
        <PreferencesPanel v-else-if="tab === 'preferences'" :user-id="userId" />
        <SavedPanel v-else-if="tab === 'saved'" :user-id="userId!" />
        <ReviewsPanel v-else :user-id="userId" />
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import FollowingPanel from '../components/profile/FollowingPanel.vue';
import PreferencesPanel from '../components/profile/PreferencesPanel.vue';
import ReviewsPanel from '../components/profile/ReviewsPanel.vue';
import SavedPanel from '../components/profile/SavedPanel.vue';
// Use the project banner image as the profile cover
// Vite will process this asset and return a URL
// Path from this file (src/pages) to media/banner.png is ../../media/banner.png
import bannerUrl from '../../media/banner.png';

const tab = ref<'following' | 'preferences' | 'saved' | 'reviews'>('following');
const auth = useAuthStore();
const router = useRouter();
const { currentUserId: userId, currentUsername: username } = storeToRefs(auth);

function logout() {
  auth.logout();
  router.push({ name: 'auth' });
}

const coverStyle = {
  backgroundImage: `url(${bannerUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};
</script>

<style scoped>
.profile-page { max-width: 1000px; margin: 0 auto; padding: 0 1rem 1rem; display: grid; gap: 0.75rem; }
.not-auth { color: #666; }
.hero { position: relative; border-radius: 16px; overflow: hidden; border: 1px solid #eee; background: #fff; }
.cover { height: 120px; }
.hero-inner { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; }
.name { margin: 0; font-size: 1.4rem; }
.hero-actions { display: flex; gap: 0.5rem; }
.btn { padding: 0.5rem 0.8rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; }
.btn.ghost { background: #fafafa; }
.btn.danger { background: #fee2e2; border-color: #fecaca; }
.btn:hover { filter: brightness(0.98); }

.tabs { display: flex; gap: 0.4rem; background: #f9fafb; padding: 0.4rem; border: 1px solid #eee; border-radius: 999px; justify-content: center; }
.tab { padding: 0.4rem 0.9rem; border-radius: 999px; border: 1px solid transparent; background: transparent; color: #374151; }
.tab.active { background: #111827; color: #fff; }

.panel { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 1rem; box-shadow: 0 8px 20px rgba(0,0,0,0.04); }
</style>
