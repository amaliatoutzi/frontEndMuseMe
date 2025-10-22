<div align="center">

# MuseMe — Frontend

Personalized museum discovery with social signals, fast browse, and a clean visit diary.

</div>

## Overview

MuseMe helps you quickly decide what museum to visit and which exhibits to see, powered by your own tastes and light social proof from friends.

This repository is the Vue 3 + Vite frontend. It talks to a backend (proxied at `/api`) for auth, social/following, reviews, visits, similarity, and saving.

## Features

- Spotlight recommendations
	- “For you” shows 6 recommended museums based on your highly rated places and preferences
	- One-click Refresh for a new slice of the ranked pool
	- Photo header, quick actions (Directions, Save)

- Browse directory
	- Fast search by name/address/tags
	- Filters modal (Borough, Tag)
	- Media header if a `pictureUrl` exists in the catalog

- Friends Feed (social proof)
	- Swipeable photo gallery per visit (native horizontal scroll)
	- Exhibits visited, per-exhibit notes, and star ratings
	- Tap museum name to open a modal with its card and Save/Unsave

- Visits (Showcase)
	- Recent visits list with chevron toggles; date-only timestamps
	- Add Visit form: pick museum, select exhibits, add ratings, notes, and photos per exhibit
	- Persists a museum-level review (stars + optional note) when provided

- Profile
	- Banner image, tabs for Following, Preferences, Saved, Reviews
	- Following: searchable Followers/Following, mutual pill (blue), explicit Unfollow
	- Preferences: clickable tags; chips turn brand blue on hover
	- Saved: bookmark action, compact cards with tags

- Auth
	- Login / Register forms with brand-blue hover buttons
	- Post-auth redirect to Spotlight

- Design system
	- Global CSS variables for brand palette (MuseMe blue `#1D5CAD`), surfaces, borders, radius, and shadow
	- Cohesive cards, buttons, icon links, modals, and active nav styling with subtle separators

## Tech stack

- Vue 3, TypeScript, Vite
- Pinia (state), Vue Router
- Axios (HTTP with proxy)
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

## Project structure (high level)

```
src/
	pages/            # Route-level pages: Spotlight, Browse, Feed, Profile, Showcase, Auth
	components/       # UI components (cards, auth forms, profile panels, star rating, etc.)
	api/              # Axios wrappers for backend endpoints
	stores/           # Pinia stores (auth, saving, preferences, visits, users)
	router/           # Vue Router
	styles/           # Global theme CSS (variables, base)
	utils/            # Catalog helpers
```

## Accessibility & UX

- Modals close on overlay click or Escape
- Active nav item has color + subtle background/underline
- Buttons have focus-visible rings via CSS variables
- Swipeable galleries use native scroll with snap

## Troubleshooting

- 500 errors from Axios
	- Check backend logs; the frontend logs the failing method, URL, status, and a masked request payload in dev tools
	- Confirm the backend is running at `:8000` and Vite proxy is active
	- Verify expected response shapes per endpoint notes above

- CORS issues
	- Use the dev proxy (already configured). Do not call the backend directly from the browser origin during dev.

- Images not showing
	- Ensure `pictureUrl` in the catalog points to a reachable URL or a bundled asset

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run type-check` — run Vue TypeScript checks

## License

Proprietary — all rights reserved by the project owner. Replace this section with your preferred license if you plan to open source.
