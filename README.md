# My Location

A bare-bones GPS map PWA for Android. Shows your live position on an OpenStreetMap
map, and lets you download map regions for offline use — no data connection
needed once a region is saved.

**Live app:** https://hodzic.github.io/gpsmap/

## Features

- **Live GPS marker** — shows your current position with an accuracy circle.
  A "Track" toggle follows you continuously as you move.
- **Capture tab** — pan/zoom to an area, name it, pick a detail level, and
  download its map tiles for offline use. Shows an estimated tile count and
  size before you commit.
- **Offline tab** — lists your saved regions (name, tile count, size, zoom
  range). Tap one to view it with no network at all.
- **Installable** — add it to your Android home screen from Chrome for a
  standalone, full-screen app experience.

## Detail levels

Each level downloads extra zoom levels *beyond* whatever zoom you're
currently viewing at when you hit "Save this view":

| Level | Extra zoom levels | Typical use |
|---|---|---|
| Overview only | +0 | Just what's on screen right now |
| Neighborhood detail | +2 | A town or neighborhood |
| Street-level detail | +4 | Navigating on foot/bike at street level |

Zoom in close *before* saving if you want genuine street-level detail — the
levels are relative to your current zoom, not absolute.

Each extra level roughly quadruples the tile count (and download size) for
the same area, so there's a 2,500-tile cap per region to keep downloads
reasonable.

## How it works

- Map tiles come from the [OpenStreetMap](https://www.openstreetmap.org/copyright)
  tile server.
- A Service Worker caches the app itself (so it loads instantly and works
  offline) and intercepts tile requests — serving cached tiles when you're
  offline, and refreshing them from the network when you're not.
- Region metadata (name, bounds, zoom range, size) is stored in IndexedDB;
  the actual tile images live in the browser's Cache Storage.

## Requirements

Needs a host with **no restrictive Content-Security-Policy** on
`worker-src` or `connect-src` — Service Workers and cross-origin `fetch()`
both have to work normally. GitHub Pages, Cloudflare Pages, and Netlify all
work out of the box. (Neocities' free tier does not — its CSP blocks
Service Worker registration entirely.)

## Deploying (GitHub Pages)

1. Push these files to a repo (flat, no subfolder): `index.html`,
   `manifest.json`, `service-worker.js`, `icon-192.png`, `icon-512.png`.
2. Repo **Settings → Pages** → Source: "Deploy from a branch" → Branch:
   `main`, folder `/ (root)` → Save.
3. Visit `https://<username>.github.io/<repo>/` — confirm the status line
   under the Capture panel says "Offline support: ready."
4. In Chrome's menu, tap **Install app** to add it to your home screen.

## Installing a region for offline use

1. Open the app while you have a connection.
2. **Capture** tab: pan/zoom to the area, zoom in for street-level detail if
   needed, give it a name, pick a detail level, tap **Save this view**.
3. Switch to **Offline** tab any time afterward — tap the region to view it,
   even with no signal.

## Known limitations

- Tile downloads are paced (~60ms between requests) to stay reasonable
  against OpenStreetMap's free tile server — don't download excessively
  large regions.
- iOS Safari can evict cached data for web apps under storage pressure;
  Android/Chrome is more reliable, but nothing's guaranteed forever — redownload
  a region if it stops showing tiles offline.
- Coordinates are decimal degrees (WGS84), shown to 5 decimal places
  (~1 m precision) — though actual GPS accuracy is usually only ~5–10 m.
