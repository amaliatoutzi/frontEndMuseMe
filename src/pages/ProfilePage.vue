<template>
  <section class="profile-page">
    <div v-if="!userId" class="not-auth">Not authenticated.</div>
    <div v-else class="profile-wrap">
      <!-- Social-style hero -->
      <header class="hero">
        <div class="hero-inner">
          <div class="identity">
            <div class="avatar-wrap">
              <Avatar :first-name="profile?.firstName || null" :last-name="profile?.lastName || null" :username="username || null" :url="profile?.profilePictureUrl || null" :size="84" />
              <button class="edit-avatar-btn" @click="openAvatarModal" aria-label="Edit profile picture">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                  <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm2.92 2.33H5.5v-.42l8.49-8.49.42.42-8.49 8.49zM20.71 7.04a1.003 1.003 0 000-1.42l-2.33-2.33a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
            </div>
            <div class="who">
              <h2 class="name">{{ displayName }}</h2>
              <p class="handle">@{{ username }}</p>
            </div>
          </div>
          <div class="hero-actions">
            <button class="btn danger" @click="logout">Logout</button>
          </div>
        </div>
      </header>

      <!-- Modal for avatar editing -->
      <Modal v-model="showAvatarModal" title="Profile picture">
        <template #default>
          <div class="modal-content">
            <div class="preview-row">
              <div class="preview-avatar">
                <Avatar :first-name="profile?.firstName || null" :last-name="profile?.lastName || null" :username="username || null" :url="previewUrl || profile?.profilePictureUrl || null" :size="84" />
              </div>
              <div class="picker">
                <input type="file" accept="image/*" @change="onPickFile" />
                <p class="hint">Choose an image. It will be resized before saving.</p>
              </div>
            </div>
            <p v-if="profileError" class="error">{{ profileError }}</p>
          </div>
        </template>
        <template #actions>
          <button class="btn" @click="closeAvatarModal" :disabled="loading">Cancel</button>
          <button v-if="profile?.profilePictureUrl" class="btn danger" @click="onRemovePic" :disabled="loading">Remove</button>
          <button class="btn primary" @click="onSavePic" :disabled="!canSave || loading">Save</button>
        </template>
      </Modal>

      <!-- Connections summary and lists (like Instagram) -->
      <section class="connections" aria-label="Connections">
        <div class="stats">
          <button class="stat chip" @click="openConn('followers')" aria-label="View followers">
            <span class="num">{{ followersCount }}</span>
            <span class="label">Followers</span>
          </button>
          <button class="stat chip" @click="openConn('following')" aria-label="View following">
            <span class="num">{{ followingCount }}</span>
            <span class="label">Following</span>
          </button>
        </div>
        <div v-if="connOpen !== 'none'" class="list-wrap">
            <div class="conn-head">
            <h3 class="conn-title">{{ connOpen === 'followers' ? 'Followers' : 'Following' }}</h3>
            <button class="btn ghost" @click="closeConn" aria-label="Close list">Close</button>
          </div>
          <FollowingPanel :user-id="userId!" :username="username || ''" :mode="connOpen === 'followers' ? 'followers' : 'following'" @changed="loadConnectionCounts" />
        </div>
      </section>

      <!-- Tabs -->
      <nav class="tabs" aria-label="Profile sections">
        <button class="tab" :class="{ active: tab === 'preferences' }" @click="tab = 'preferences'" :aria-current="tab === 'preferences' ? 'page' : undefined">
          <Icon name="preferences" :size="16" />
          <span>Preferences</span>
        </button>
        <button class="tab" :class="{ active: tab === 'saved' }" @click="tab = 'saved'" :aria-current="tab === 'saved' ? 'page' : undefined">
          <Icon name="bookmark" :size="16" />
          <span>Saved</span>
        </button>
        <button class="tab" :class="{ active: tab === 'reviews' }" @click="tab = 'reviews'" :aria-current="tab === 'reviews' ? 'page' : undefined">
          <Icon name="star" :size="16" />
          <span>Reviews</span>
        </button>
      </nav>

      <!-- Content panel -->
      <section class="panel">
        <PreferencesPanel v-if="tab === 'preferences'" :user-id="userId" />
        <SavedPanel v-else-if="tab === 'saved'" :user-id="userId!" />
        <ReviewsPanel v-else :user-id="userId" />
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import FollowingPanel from '../components/profile/FollowingPanel.vue';
import PreferencesPanel from '../components/profile/PreferencesPanel.vue';
import ReviewsPanel from '../components/profile/ReviewsPanel.vue';
import SavedPanel from '../components/profile/SavedPanel.vue';
import Avatar from '../components/profile/Avatar.vue';
import Modal from '../components/ui/Modal.vue';
import Icon from '../components/ui/Icon.vue';
import { useProfileStore } from '../stores/profile';
import { getFollowers, getFollowees } from '../api/following';
import { useToastStore } from '../stores/toast';

const tab = ref<'preferences' | 'saved' | 'reviews'>('preferences');
const auth = useAuthStore();
const router = useRouter();
const { currentUserId: userId, currentUsername: username } = storeToRefs(auth);
const profileStore = useProfileStore();
const { profile, loading, error: profileError } = storeToRefs(profileStore);
const toast = useToastStore();

function logout() {
  auth.logout();
  router.push({ name: 'auth' });
}

// No banner cover; keep header minimal.

onMounted(() => {
  if (userId.value) profileStore.loadForCurrentUser();
});

watch(userId, (v) => { if (v) profileStore.loadForCurrentUser(); else profileStore.$reset(); });

const displayName = computed(() => profileStore.fullName || username.value || '');

// Avatar controls logic
const showAvatarModal = ref(false);
const pickedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const canSave = computed(() => !!pickedFile.value && !!previewUrl.value);

function openAvatarModal() { showAvatarModal.value = true; pickedFile.value = null; previewUrl.value = null; }
function closeAvatarModal() { showAvatarModal.value = false; pickedFile.value = null; previewUrl.value = null; }
async function onSavePic() {
  if (!pickedFile.value) return;
  try {
    const url = await fileToDataUrl(pickedFile.value);
    if (profile.value?.profilePictureUrl) await profileStore.editProfilePicture(url);
    else await profileStore.addProfilePicture(url);
    showAvatarModal.value = false;
    pickedFile.value = null;
    previewUrl.value = null;
    toast.success('Profile picture updated');
  } catch {
    // errors surface via profileError already
  }
}
async function onRemovePic() {
  try {
    await profileStore.removeProfilePicture();
    showAvatarModal.value = false;
    pickedFile.value = null;
    previewUrl.value = null;
    toast.info('Profile picture removed');
  } catch { /* error displayed via store */ }
}

function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0] || null;
  pickedFile.value = null;
  previewUrl.value = null;
  if (!f) return;
  if (!f.type.startsWith('image/')) return; // silently ignore non-images
  fileToDataUrl(f, 512).then((url) => {
    previewUrl.value = url;
    pickedFile.value = f;
  }).catch(() => { /* ignore */ });
}

async function fileToDataUrl(file: File, maxDim = 512): Promise<string> {
  const buf = await file.arrayBuffer();
  const blobUrl = URL.createObjectURL(new Blob([buf], { type: file.type || 'application/octet-stream' }));
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = blobUrl;
    });
    const { width, height } = img;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, w, h);
    const mime = file.type.includes('png') ? 'image/png' : 'image/jpeg';
    return canvas.toDataURL(mime, 0.9);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

// Followers/following counts
const followersCount = ref(0);
const followingCount = ref(0);
async function loadConnectionCounts() {
  if (!userId.value) { followersCount.value = 0; followingCount.value = 0; return; }
  try {
    const [f1, f2] = await Promise.all([getFollowers(userId.value), getFollowees(userId.value)]);
    followersCount.value = f1.length;
    followingCount.value = f2.length;
  } catch { /* ignore */ }
}

onMounted(loadConnectionCounts);
watch(userId, () => loadConnectionCounts());

// Refresh counts when following state changes anywhere in the app
const onFollowingChanged = () => loadConnectionCounts();
onMounted(() => { window.addEventListener('following-changed', onFollowingChanged as EventListener); });
onUnmounted(() => { window.removeEventListener('following-changed', onFollowingChanged as EventListener); });

// Toggle which connections list to show (hidden by default)
const connOpen = ref<'none' | 'followers' | 'following'>('none');
function openConn(which: 'followers' | 'following') { connOpen.value = which; }
function closeConn() { connOpen.value = 'none'; }
</script>

<style scoped>
.profile-page { max-width: 1000px; margin: 0 auto; padding: 0 1rem 1rem; display: grid; gap: 0.75rem; }
.not-auth { color: #666; }
.hero { position: relative; border-radius: 16px; border: 1px solid var(--border); background: var(--surface); box-shadow: var(--shadow-1), inset 0 0 0 2px rgba(201,169,97,0.35); }
.hero-inner { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; }
.identity { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 0.75rem; }
.avatar-wrap { position: relative; width: 84px; height: 84px; }
.edit-avatar-btn { position: absolute; right: -4px; bottom: -4px; width: 28px; height: 28px; border-radius: 999px; border: 1px solid var(--border); background: #fff; display: grid; place-items: center; color: #111827; box-shadow: 0 2px 6px rgba(0,0,0,0.12); transition: transform var(--dur-normal) var(--ease-standard), box-shadow var(--dur-normal) var(--ease-standard); }
.edit-avatar-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(16,24,40,0.12); }
.who { display: grid; }
.name { margin: 0; font-size: 1.4rem; line-height: 1.1; }
.handle { margin: 0; color: var(--muted); }
.hero-actions { display: flex; gap: 0.5rem; }
.btn { padding: 0.5rem 0.8rem; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; color: #111827; }
.btn.ghost { background: #fafafa; }
.btn.danger { background: #fee2e2; border-color: #fecaca; }
.btn { transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard), transform var(--dur-normal) var(--ease-standard); }
.btn:hover { filter: brightness(0.98); transform: translateY(-1px); }
.btn.ghost:hover { background: var(--accent-gold); border-color: var(--accent-gold); color: #fff; filter: none; }
.btn.primary { background: var(--brand-600); border-color: var(--brand-600); color: #fff; }
.btn.primary:hover { background: var(--accent-gold); border-color: var(--accent-gold); color: #fff; filter: none; }
.btn:disabled, .btn[disabled] { opacity: 0.6; cursor: not-allowed; }
.btn.primary:disabled, .btn.primary[disabled] { color: #fff; }
.btn:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }

.error { color: #b00020; background: #fce4ec; padding: 0.5rem; border-radius: 6px; border-left: 3px solid #b00020; margin: 0; }

.modal-content { display: grid; gap: 0.75rem; }
.preview-row { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 0.75rem; }
.preview-avatar { width: 84px; height: 84px; }
.picker input[type="file"] { padding: 0.35rem; border: 1px dashed #ddd; border-radius: 6px; }
.hint { color: #6b7280; margin: 0; font-size: 0.85rem; }

.tabs { display: flex; gap: 0.5rem; padding: 0.25rem; background: transparent; border: none; border-radius: 0; justify-content: center; }
.tab { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem; border-radius: 999px; border: 1px solid transparent; background: transparent; color: var(--text); transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard), transform var(--dur-normal) var(--ease-standard); }
.tab:hover { background: var(--surface-2); transform: translateY(-1px); }
.tab.active { background: var(--teal); color: #fff; border-color: var(--teal); box-shadow: 0 4px 12px rgba(45,95,93,0.22); }

.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; box-shadow: var(--shadow-1); }

.connections { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 0.75rem 1rem; display: grid; gap: 0.75rem; box-shadow: var(--shadow-1); }
.stats { display: flex; gap: 0.9rem; align-items: center; }
.stat { display: grid; grid-auto-flow: row; place-items: center; color: var(--brand-600); }
.stat .num { font-weight: 600; font-size: 0.98rem; line-height: 1; color: var(--brand-600); }
.stat .label { color: var(--brand-600); font-size: 0.9rem; line-height: 1.1; }
.list-wrap { padding-top: 0.25rem; }

/* clickable chips for followers/following counts — minimal, no outline */
.chip { padding: 0.2rem 0.5rem; border-radius: 999px; border: none; background: transparent; cursor: pointer; color: var(--brand-600); transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard); }
.chip:hover { background: var(--brand-50); color: var(--brand-700); }
.chip:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }

.conn-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.conn-title { margin: 0; font-size: 1.05rem; color: var(--brand-600); }
</style>
