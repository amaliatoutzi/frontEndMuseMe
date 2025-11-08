import axios from 'axios';

// Session token for EXCLUDED routes (set from auth store)
let sessionToken: string | null = null;
export function setSessionToken(token: string | null) {
  sessionToken = token || null;
}

// EXCLUDED routes: backend intercepts and expects { sessionToken, payload }
// Keep the list focused on routes actually used by this frontend.
const EXCLUDED_ROUTES = new Set<string>([
  // Following
  'Following/follow',
  'Following/unfollow',
  'Following/_getFollowers',
  'Following/_getFollowees',
  'Following/_getFollows',
  'Following/_getUserIdByUsername',
  'Following/_getUsernameByUserId',
  'Following/_areFriends',
  // User preferences
  'UserPreferences/_getPreferencesForUser',
  'UserPreferences/addPreference',
  'UserPreferences/removePreference',
  // Saving
  'Saving/saveItem',
  'Saving/unsaveItem',
  'Saving/_listSaved',
  // Reviewing
  'Reviewing/_getReviewsByUser',
  'Reviewing/_getReview',
  'Reviewing/_getReviewsByItem',
  'Reviewing/upsertReview',
  'Reviewing/init',
  'Reviewing/_isValidItem',
  'Reviewing/clearReview',
  // Visits
  'Visit/createVisit',
  'Visit/_getVisitsByUser',
  'Visit/_getVisitsByOwner',
  'Visit/_getVisit',
  'Visit/_getEntriesByVisit',
  'Visit/_listEntriesByVisit',
  'Visit/_getEntry',
  'Visit/addEntry',
  'Visit/editEntry',
  'Visit/removeEntry',
  'Visit/removeVisit',
  'Visit/deleteVisit',
  // Profile
  'Profile/_getProfile',
  'Profile/isBlank',
  'Profile/addName',
  'Profile/addProfilePicture',
  'Profile/editProfilePicture',
  'Profile/removeProfilePicture',
  // Similarity
  'Similarity/rebuildSimilarity',
  'Similarity/neighbors',
]);

const http = axios.create({
  baseURL: '/api', // Changed from http://localhost:8000/api to use Vite proxy
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

function maskSensitive(v: any) {
  try {
    const obj = typeof v === 'string' ? JSON.parse(v) : v;
    if (!obj || typeof obj !== 'object') return v;
    const clone: any = Array.isArray(obj) ? [...obj] : { ...obj };
    const maskKeys = ['password', 'pass', 'token', 'sessiontoken'];
    for (const k of Object.keys(clone)) {
      if (maskKeys.includes(k.toLowerCase())) clone[k] = '***';
    }
    return clone;
  } catch {
    return v;
  }
}

// Wrap EXCLUDED route bodies as { sessionToken, payload }
http.interceptors.request.use((config) => {
  try {
    const method = (config.method || 'get').toUpperCase();
    if (method !== 'POST') return config;
    // Normalize to Concept/Action without leading slash
    let url = String(config.url || '').trim();
    if (!url) return config;
    if (url.startsWith('/')) url = url.slice(1);
    // If someone accidentally included base path inside url, strip it
    if (url.startsWith('api/')) url = url.slice(4);
    if (!EXCLUDED_ROUTES.has(url)) return config; // included routes: send original body

    const alreadyWrapped = config.data && typeof config.data === 'object' && 'payload' in (config.data as any) && 'sessionToken' in (config.data as any);
    if (alreadyWrapped) return config;

    const original = config.data ?? {};
    (config as any).data = { sessionToken: sessionToken ?? undefined, payload: original };
    return config;
  } catch {
    return config;
  }
});

http.interceptors.response.use(
  (r) => r,
  (error) => {
    // Centralized error logging; surface to UI at call-site
    const msg = error?.response?.data?.error || error?.message || 'API error';
    const method = (error?.config?.method || 'GET').toUpperCase();
    const url = error?.config?.url || '(unknown URL)';
    const status = error?.response?.status;
    const payload = maskSensitive(error?.config?.data);
    console.error('[API]', msg, { method, url, status, payload, response: error?.response });
    return Promise.reject(error);
  }
);

export default http;
