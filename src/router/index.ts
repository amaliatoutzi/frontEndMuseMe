import { createRouter, createWebHistory, RouteLocationNormalized } from 'vue-router';
import AuthPage from '../pages/AuthPage.vue';
import ProfilePage from '../pages/ProfilePage.vue';
import MuseumsPage from '../pages/MuseumsPage.vue';
import VisitsPage from '../pages/VisitsPage.vue';
import SpotlightPage from '../pages/SpotlightPage.vue';
import HomePage from '../pages/HomePage.vue';
import FeedPage from '../pages/FeedPage.vue';
import { useAuthStore, STORAGE_KEY } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
  { path: '/', name: 'home', component: HomePage, meta: { public: true } },
  { path: '/feed', name: 'feed', component: FeedPage },
    { path: '/auth', name: 'auth', component: AuthPage, meta: { public: true } },
    { path: '/profile', name: 'profile', component: ProfilePage },
    { path: '/museums', name: 'museums', component: MuseumsPage, meta: { public: true } },
    { path: '/showcase', name: 'showcase', component: VisitsPage },
    { path: '/spotlight', name: 'spotlight', component: SpotlightPage, meta: { public: true } },
  ],
});

router.beforeEach((to: RouteLocationNormalized) => {
  // Use store if available; fallback to localStorage to avoid timing issues
  let isAuthed = false;
  try {
    const store = useAuthStore();
    isAuthed = store.isAuthenticated;
  } catch (_) {
    const raw = localStorage.getItem(STORAGE_KEY);
    isAuthed = !!raw && JSON.parse(raw) !== null;
  }

  if (!to.meta.public && !isAuthed) {
    return { name: 'auth' };
  }
  if (to.name === 'auth' && isAuthed) {
    // If already authenticated, don't show the auth page; go to Spotlight
    return { name: 'spotlight' };
  }
  return true;
});

export default router;
