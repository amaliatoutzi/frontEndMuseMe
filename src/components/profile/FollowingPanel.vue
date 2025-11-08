<template>
  <div class="following">
    <p v-if="error" class="error">{{ error }}</p>

    <div class="cards">
      <section v-if="(props.mode ?? 'both') !== 'following'" class="column">
        <header v-if="(props.mode ?? 'both') === 'both'" class="col-head">
          <h3>Followers</h3>
          <span class="count">{{ followers.length }}</span>
        </header>
        <div class="search">
          <input v-model.trim="followersQuery" placeholder="Search followers" />
        </div>
        <p v-if="followers.length === 0" class="banner empty">No followers yet.</p>
        <ul v-else class="people">
          <li v-for="f in filteredFollowers" :key="f" class="person">
            <div class="who">
              <span class="avatar" aria-hidden="true">{{ initial(displayName(f)) }}</span>
              <span class="name">{{ displayName(f) }}</span>
            </div>
            <span v-if="mutualSet.has(f)" class="pill">Mutual</span>
          </li>
        </ul>
      </section>
      <section v-if="(props.mode ?? 'both') !== 'followers'" class="column">
        <header v-if="(props.mode ?? 'both') === 'both'" class="col-head">
          <h3>Following</h3>
          <span class="count">{{ followees.length }}</span>
        </header>
        <div class="search">
          <input v-model.trim="followeesQuery" placeholder="Search following" />
        </div>
        <p v-if="followees.length === 0" class="banner empty">You aren’t following anyone yet.</p>
        <ul v-else class="people">
          <li v-for="f in filteredFollowees" :key="f" class="person">
            <div class="who">
              <span class="avatar" aria-hidden="true">{{ initial(displayName(f)) }}</span>
              <span class="name">{{ displayName(f) }}</span>
            </div>
            <div class="actions">
              <button class="ghost unfollow-btn" @click="doUnfollow(f)" :disabled="busy">Unfollow</button>
            </div>
          </li>
        </ul>
      </section>
    </div>


  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useToastStore } from '../../stores/toast';
import { getFollowers, getFollowees, follow, unfollow } from '../../api/following';
import { getUsernameByUserId } from '../../api/users';
import { useUsersStore } from '../../stores/users';

const props = defineProps<{ userId: string; username: string; mode?: 'followers' | 'following' | 'both' }>();
const emit = defineEmits<{ (e: 'changed'): void }>();
const followers = ref<string[]>([]);
const followees = ref<string[]>([]);
const error = ref<string | null>(null);
const busy = ref(false);
const usersStore = useUsersStore();
const toast = useToastStore();
const followersQuery = ref('');
const followeesQuery = ref('');

const mutualSet = computed(() => {
  const set = new Set(followees.value);
  const mutual = new Set<string>();
  for (const u of followers.value) if (set.has(u)) mutual.add(u);
  return mutual;
});

async function load() {
  error.value = null;
  try {
    const [flwrs, flwees] = await Promise.all([
      getFollowers(props.userId),
      getFollowees(props.userId),
    ]);
    followers.value = flwrs;
    followees.value = flwees;

    // First pass: attempt batch resolution by issuing one request per unknown id (existing approach)
    const unknown = [...new Set([...flwrs, ...flwees].filter((id) => !usersStore.getUsername(id)))];
    // Resolve sequentially to avoid hammering the backend if many
    for (const id of unknown) {
      try {
        const name = await getUsernameByUserId(id);
        if (name) usersStore.setMapping(id, name);
      } catch {
        /* ignore individual failures */
      }
    }
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || 'Failed to load following data';
  }
}

async function doUnfollow(u: string) {
  busy.value = true; error.value = null;
  try {
    await unfollow(props.userId, u);
    await load();
    emit('changed');
    const name = displayName(u);
    toast.success(`Unfollowed ${name || 'user'}`);
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || 'Unfollow failed';
  } finally {
    busy.value = false;
  }
}

onMounted(load);

// Keep panel in sync with global follow/unfollow actions
const onFollowingChanged = () => load();
onMounted(() => { window.addEventListener('following-changed', onFollowingChanged as EventListener); });
onUnmounted(() => { window.removeEventListener('following-changed', onFollowingChanged as EventListener); });

function displayName(id: string): string {
  const mapped = usersStore.getUsername(id);
  if (mapped) return mapped;
  // Opportunistic inline resolution on first render (lazy hydrate)
  getUsernameByUserId(id).then((name) => { if (name) usersStore.setMapping(id, name); }).catch(() => {});
  return 'unknown';
}
function initial(name: string): string { return (name?.[0] || '?').toUpperCase(); }

const filteredFollowers = computed(() => {
  const q = followersQuery.value.trim().toLowerCase();
  if (!q) return followers.value;
  return followers.value.filter((id) => {
    const name = displayName(id).toLowerCase();
    return name.includes(q) || id.toLowerCase().includes(q);
  });
});

const filteredFollowees = computed(() => {
  const q = followeesQuery.value.trim().toLowerCase();
  if (!q) return followees.value;
  return followees.value.filter((id) => {
    const name = displayName(id).toLowerCase();
    return name.includes(q) || id.toLowerCase().includes(q);
  });
});
</script>

<style scoped>
/* responsive two-column on wide, single column on small */
.cards { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
@media (min-width: 900px) { .cards { grid-template-columns: 1fr 1fr; } }

.column { display: grid; gap: 0.5rem; padding: 0.25rem; }
.col-head { display: flex; align-items: center; justify-content: space-between; }
.col-head h3 { margin: 0; font-size: 0.95rem; }
.count { background: var(--surface-2); border: 1px solid var(--border); border-radius: 999px; padding: 0.1rem 0.5rem; font-size: 0.8rem; color: var(--muted); }

.search input { width: 100%; padding: 0.4rem 0.55rem; border: 1px solid var(--border); border-radius: 8px; background: #fff; }

.people { list-style: none; padding: 0; margin: 0; }
.person { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.4rem 0; }
.person + .person { border-top: 1px solid var(--border); }
.who { display: inline-flex; align-items: center; gap: 0.5rem; }
.avatar { width: 26px; height: 26px; border-radius: 999px; background: var(--brand-600); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 0.85rem; }
.name { font-weight: 600; }
.pill { border: 1px solid var(--accent-gold); background: #fffdf7; color: var(--brand-600); font-size: 0.75rem; border-radius: 999px; padding: 0.1rem 0.45rem; }
.icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; background: transparent; color: #444; border-radius: 6px; }
.icon-btn:hover { background: var(--surface-2); }
.actions { display: flex; align-items: center; gap: 0.25rem; }
.unfollow-btn { padding: 0.25rem 0.5rem; font-size: 0.88rem; }
.unfollow-btn { transition: background var(--dur-quick) var(--ease-standard), color var(--dur-quick) var(--ease-standard), border-color var(--dur-quick) var(--ease-standard), transform var(--dur-normal) var(--ease-standard); }
.unfollow-btn:hover { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }
.error { color: #b00020; margin-top: 0.5rem; }

/* Keep the panel compact with internal scrolling */
.following { max-height: 420px; overflow: auto; padding-right: 2px; }
</style>
