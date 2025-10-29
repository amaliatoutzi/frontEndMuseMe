<div align="center">

# MuseMe — Frontend

Personalized museum discovery with social signals, fast browse, and a clean visit diary.

</div>

## Overview

MuseMe helps you quickly decide what museum to visit and which exhibits to see, powered by your own tastes and light social proof from friends.

This repository is the Vue 3 + Vite frontend. It talks to a backend (proxied at `/api`) for auth, social/following, reviews, visits, similarity, and saving.

## Features

- Spotlight recommendations
	- “For you” shows recommended museums based on your highly rated places and preferences, with “Because you liked…” context
	- One-click Refresh for a new slice of the ranked pool
	- Photo header, quick actions (Directions, Save)
	- Tap a museum to open a quick details modal (Website, Directions, Save/Unsave)

- Browse directory through search bar
	- Fast search by name/address/tags
	- Filters modal (Borough, Tag)
	- List ↔ Map view toggle; interactive map with brand-styled markers
	- Gold selection halo when a marker is selected; tap to open the museum details modal
	- Media header if a `pictureUrl` exists in the catalog

- Friends Feed (social proof)
	- Swipeable photo gallery per visit (native horizontal scroll)
	- Exhibits visited, per-exhibit notes, and star ratings
	- Tap museum name to open a modal with its card and Save/Unsave

- Visits (Showcase)
	- Recent visits list with chevron toggles; date-only timestamps
	- Add Visit form: pick museum, select exhibits, add ratings, notes, and photos per exhibit
	- Persists a museum-level review (stars + optional note) when provided
	- Stats cards keep teal text with a subtle gold top border

- Profile
	- Banner image, tabs for Following, Preferences, Saved, Reviews
	- Following: searchable Followers/Following, mutual pill (blue), explicit Unfollow
	- Preferences: clickable tags; chips turn brand blue on hover
	- Saved: bookmark action, compact cards with tags
	- User can edit or remove their profile picture

- Auth
	- Login / Register forms
	- Post-auth redirect to main page
	- Ability to add name and profile picture


- Navigation & utilities
	- Floating Map button to open a full-screen map view from anywhere
	- Scroll-to-top button appears on long pages for easy navigation

- Design system
	- Brand palette moved to deep burgundy for primary text/links, with gold accents and teal for curated stats
	- Global CSS variables for colors, surfaces, borders, radius, and shadow (see `src/styles/global.css`)
	- Reusable SVG GoldDivider under key headings; icon system via a shared `Icon` component
	- Cohesive cards with a gold top edge accent, consistent icon links, modals, and subtle separators

## Tech stack

- Vue 3, TypeScript, Vite
- Pinia (state), Vue Router
- Axios (HTTP with proxy)
- Mapping: Leaflet + OpenStreetMap tiles, custom marker styling
- Styling: vanilla CSS with CSS variables; Tailwind config exists but global styles lean on CSS vars

## Getting started

Prereqs: Node 18+ and npm.

1) Install dependencies

```bash
npm install
```

2) Start the dev server (frontend)

```bash
npm run dev
```

3) Ensure the backend is running at `http://localhost:8000` (the frontend proxies `/api` → `:8000`).

4) Build for production

```bash
npm run build
npm run preview
```

Type checking:

```bash
npm run type-check
```

## UI and brand notes

- Brand colors (defined in `src/styles/global.css`)
	- Burgundy: `--brand-600`, `--brand-700` for primary and hover
	- Gold accent: `--accent-gold` for decorative lines, edges, and highlights
	- Teal: `--teal` used in curated statistics while keeping text legible
- GoldDivider component: `src/components/ui/GoldDivider.vue`
	- Props: `height`, `stroke`, `ornament-stroke`, `matchTo` (element ID to match width), or explicit `width`
	- Used under Spotlight, Feed, and Showcase titles, sized tightly to the heading
- Icon system: `src/components/ui/Icon.vue`
	- Inline SVG library for consistent icons (e.g., camera, search, arrows)
- Card accents
	- All cards have a 3px gold gradient top edge; museum cards integrate this in their default variant
- Map selection affordance
	- Selected marker gets a subtle gold halo; click the map background to clear selection
- Home hero accent
	- A thin gold bar sits under the hero gradient for a refined entry point

## API integration

The frontend calls these endpoints via the Vite proxy (see `vite.config.ts`). Replace or extend on the backend as needed.

- Auth (`/UserAuthentication/...`)
	- `POST /UserAuthentication/register` → `{ user: string } | { error }`
	- `POST /UserAuthentication/authenticate` → `{ user: string } | { error }`

- Following (`/Following/...`)
	- `POST /Following/_getFollowers` → `[{ follower }]`
	- `POST /Following/_getFollowees` → `[{ followee }]`
	- `POST /Following/follow` | `POST /Following/unfollow`
	- `POST /Following/_areFriends` → `[{ areFriends: boolean }]`
	- Optional lookups: `/_getUserIdByUsername`, `/_getUsernameByUserId`

- Reviews (`/Reviewing/...`)
	- `POST /Reviewing/_getReviewsByUser` → `[{ review }]`
	- `POST /Reviewing/upsertReview`

- Visits (`/Visit/...`)
	- `POST /Visit/createVisit` → `{ visitId }`
	- `POST /Visit/_getVisitsByUser` (payload supports `{ user }` or `{ owner }`)
	- `POST /Visit/_getEntriesByVisit` (fallback `/_listEntriesByVisit`)
	- `POST /Visit/addEntry`, `editEntry`, `removeEntry`, `removeVisit` (fallback: `deleteVisit`)

- Saving (`/Saving/...`)
	- `POST /Saving/saveItem`, `unsaveItem`, `_listSaved`

- Similarity (`/Similarity/...`)
	- `POST /Similarity/neighbors` → `string[]`
	- `POST /Similarity/rebuildSimilarity`

- Preferences (`/UserPreferences/...`)
	- `POST /UserPreferences/_getPreferencesForUser` → `[{ tag }]`
	- `POST /UserPreferences/addPreference`, `removePreference`

## Configuration

- HTTP client: `src/api/http.ts`
	- `baseURL: '/api'` (goes through Vite proxy)
	- Centralized error logging prints method, URL, status, and a masked payload for easier debugging

- Vite dev proxy: `vite.config.ts`
	- Proxies `'/api'` → `http://localhost:8000`

## Data & assets

- Catalog JSON: `catalog/new-york-museums.json`
	- Museums may include `pictureUrl` leveraged across Spotlight and Browse
- Banner image: `media/banner.png` (used as Profile hero background)
- App icon / favicon: `public/logo.png`

## Project structure (high level)

```
user-journey.md     # User journey narrative (original)
updated_user_journey.md # Updated user journey narrative (latest)
catalog/            # Dataset(s) for museums/exhibits
	new-york-museums.json
media/              # App media assets
	banner.png
	logo.png
screen_recording.mp4 # Demo screen recording of the app
visual-design-study/ # Visual design references (colors, typography)
	colors.png
	fonts.png
src/
	pages/            # Route-level pages: Spotlight, Browse, Feed, Profile, Showcase, Auth
	components/       # UI components (cards, auth forms, profile panels, star rating, etc.)
	api/              # Axios wrappers for backend endpoints
	stores/           # Pinia stores (auth, saving, preferences, visits, users)
	router/           # Vue Router
	styles/           # Global theme CSS (variables, base)
	utils/            # Catalog helpers
```

## Visual design study

- Color palette: [visual-design-study/colors.png](visual-design-study/colors.png)
- Typography samples: [visual-design-study/fonts.png](visual-design-study/fonts.png)

## Updated user journey

- Latest narrative: [updated_user_journey.md](updated_user_journey.md)
- Original version: [user-journey.md](user-journey.md)

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run type-check` — run Vue TypeScript checks

## Known issues

- During build, you may see a non-blocking warning about a store being both statically and dynamically imported (e.g., `src/stores/profile.ts`). This does not impact functionality.

## Updated screen recording

- Watch on YouTube: [Updated Demo](https://youtu.be/jSrmu-8SbcY)

	[![Updated Recording](https://img.youtube.com/vi/jSrmu-8SbcY/0.jpg)](https://youtu.be/jSrmu-8SbcY)

- Details: [updated_screen_recording.md](updated_screen_recording.md)
- Legacy local file (older demo): `screen_recording.mp4`
