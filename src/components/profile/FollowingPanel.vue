<template>
  <div class="following">
    <form class="follow-box" @submit.prevent="doFollow">
      <div class="field">
        <input v-model.trim="target" placeholder="Follow by username" />
      </div>
      <button type="submit" class="primary" :disabled="busy || !target || target === username">Follow</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="cards">
      <section class="card column">
        <header class="col-head">
          <h3>Followers</h3>
          <span class="count">{{ followers.length }}</span>
        </header>
        <div class="search">
          <input v-model.trim="followersQuery" placeholder="Search followers" />
        </div>
        <ul class="people">
          <li v-for="f in filteredFollowers" :key="f" class="person">
            <div class="who">
              <span class="avatar" aria-hidden="true">{{ initial(displayName(f)) }}</span>
              <span class="name">{{ displayName(f) }}</span>
            </div>
            <span v-if="mutualSet.has(f)" class="pill">Mutual</span>
          </li>
        </ul>
      </section>
      <section class="card column">
        <header class="col-head">
          <h3>Following</h3>
          <span class="count">{{ followees.length }}</span>
        </header>
        <div class="search">
          <input v-model.trim="followeesQuery" placeholder="Search following" />
        </div>
        <ul class="people">
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
import { onMounted, ref, computed } from 'vue';
import { getFollowers, getFollowees, follow, unfollow } from '../../api/following';
import { getUserIdByUsername, getUsernameByUserId } from '../../api/users';
import { useUsersStore } from '../../stores/users';

const props = defineProps<{ userId: string; username: string }>();
const followers = ref<string[]>([]);
const followees = ref<string[]>([]);
const error = ref<string | null>(null);
const busy = ref(false);
const target = ref('');
const usersStore = useUsersStore();
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
    // Best-effort: resolve usernames for any unknown ids
    const idsToResolve = Array.from(new Set([...flwrs, ...flwees].filter((id) => !usersStore.getUsername(id))));
    await Promise.all(
      idsToResolve.map(async (id) => {
        try {
          const name = await getUsernameByUserId(id);
          if (name) usersStore.setMapping(id, name);
        } catch {
          // If reverse lookup endpoint is missing, skip silently; fallback shows 'unknown'
        }
      })
    );
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || 'Failed to load following data';
  }
}

async function doFollow() {
  if (!target.value || target.value === props.username) return;
  busy.value = true; error.value = null;
  try {
    const input = target.value.trim();
    let followeeId: string | null = null;
    // Username-only flow: never accept raw IDs from the input
    // Try local cache first
    followeeId = usersStore.getUserId(input) || null;
    if (!followeeId) {
      // Try server lookup if available
      try {
        followeeId = await getUserIdByUsername(input);
      } catch (lookupErr: any) {
        if (lookupErr?.message?.includes('Username lookup endpoint not available')) {
          throw new Error('Following by username requires a username lookup endpoint on the server.');
        }
        throw lookupErr;
      }
    }
    if (followeeId) usersStore.setMapping(followeeId, input);
    if (!followeeId) throw new Error('User not found');
    await follow(props.userId, followeeId);
    target.value = '';
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || 'Follow failed';
  } finally {
    busy.value = false;
  }
}

async function doUnfollow(u: string) {
  busy.value = true; error.value = null;
  try {
    await unfollow(props.userId, u);
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || 'Unfollow failed';
  } finally {
    busy.value = false;
  }
}

onMounted(load);

function displayName(id: string): string {
  return usersStore.getUsername(id) || 'unknown';
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
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.column { display: grid; gap: 0.5rem; padding: 0.6rem; }
.col-head { display: flex; align-items: center; justify-content: space-between; }
.col-head h3 { margin: 0; font-size: 1rem; }
.count { background: var(--surface-2); border: 1px solid var(--border); border-radius: 999px; padding: 0.1rem 0.5rem; font-size: 0.85rem; color: #444; }

.search input { width: 100%; padding: 0.45rem 0.6rem; border: 1px solid var(--border); border-radius: 8px; background: #fff; }

.people { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.35rem; }
.person { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; border: 1px solid var(--border); background: var(--surface); border-radius: 10px; padding: 0.5rem 0.6rem; }
.who { display: inline-flex; align-items: center; gap: 0.5rem; }
.avatar { width: 28px; height: 28px; border-radius: 999px; background: var(--brand-600); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 0.9rem; }
.name { font-weight: 600; }
.pill { border: 1px solid var(--brand-600); background: var(--surface-3); color: var(--brand-600); font-size: 0.8rem; border-radius: 999px; padding: 0.15rem 0.5rem; }
.icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; color: #444; border-radius: 6px; }
.icon-btn:hover { background: var(--surface-2); }
.actions { display: flex; align-items: center; gap: 0.25rem; }
.unfollow-btn { padding: 0.3rem 0.55rem; font-size: 0.9rem; }

.follow-box { margin: 0 0 0.75rem 0; display: flex; gap: 0.5rem; align-items: center; }
.follow-box .field { flex: 1; }
.follow-box input { width: 100%; padding: 0.5rem 0.6rem; border: 1px solid var(--border); border-radius: 8px; background: #fff; }
.error { color: #b00020; margin-top: 0.5rem; }
</style>
