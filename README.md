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
