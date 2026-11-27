# LUXWALL — Ultra HD Wallpaper Site

A single-file, zero-backend, ultra-luxury wallpaper site. Dark-glass design, cinematic intro, curated 4K–5K catalog.

**Live:** https://luxwalls.github.io/luxwall/ (deployed via GitHub Pages from the `main` branch)

## Features

- **Single-file build** — everything is in `index.html`. No build step, no server, no database. Open it anywhere.
- **83+ hand-curated wallpapers** — 4K to 5K+ (up to 10560×5940), SFW/halal-verified catalog.
- **10+ category vibe picker** — Landscapes, City, Space, Dark & Minimal, Vehicles, Ocean, Mountains, Snow, Forest, Islamic Art.
- **Cinematic intro** — letter-by-letter "Lux Wallpapers" title reveal with glow (whole words never break mid-line).
- **Doomsday Zone** — themed Avengers: Doomsday section with live countdown to Dec 18, 2026, 6 curated wallpapers, glitch-jumpscare entry animation.
- **Smart filters** — Top / Deep Cuts / Ultrawide / Surprise chips + search that understands `4k`, `5k`, `ultrawide`, `vertical`, `islamic`.
- **Lazy loading + infinite scroll** — images load as you scroll; fast on mobile data.
- **Mobile-first** — safe-area support, touch-friendly overlays, portrait-optimized crops.
- **Stats footer** — auto-counting footer showing the live catalog size (stays accurate as the collection grows).

## Deployment (GitHub Pages)

Already live: https://luxwalls.github.io/luxwall/

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch** → Branch: **main** → **Save**
3. Live at `https://luxwalls.github.io/luxwall/` within ~1 minute.

Any future edit = commit to `main` → site auto-updates in ~1 minute. No re-upload ever.

## Updating the catalog

The catalog lives in the `WALLS` array inside `index.html` (id, extension, resolution, views, file size). Add a row, commit, done. The stats footer count updates automatically.

## Content policy

Wallpapers are curated from free sources (Wallhaven SFW, WallpaperFlare, self-generated Islamic art). Immodest or suggestive imagery is excluded by design. Personal-use project.

## Ownership / sale notes

- Buyer receives: this repo (full commit history), the single-file site, and this README.
- Traffic tracking: a commented-out Google Analytics GA4 snippet is ready in `index.html` `<head>` — paste your `G-XXXXXXXXXX` ID and uncomment 2 lines. Done.

---

Made by **dangerdevs**.