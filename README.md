# My Location

A bare-bones GPS map PWA for Android. Shows your live position on an OpenStreetMap
map, lets you download map regions for offline use, and can overlay a georeferenced
PDF trail map on top of it — no data connection needed once a region or trail map
is saved.

**Live app:** https://hodzic.github.io/gpsmap/

## Features

- **Live GPS marker** — shows your current position with an accuracy circle.
  A "Track" toggle follows you continuously as you move.
- **Capture tab** — two buttons: **Capture region** opens an inline form
  (still over the live, pannable map) to pick a detail level, see an
  estimated tile count and size, and name the area before downloading it for
  offline use; **Add PDF map** imports a trail map to overlay on the base map.
- **Offline tab** — lists your saved regions (name, tile count, size, zoom
  range) and trail maps (name, size, how it was positioned). Tap one to view
  it with no network at all.
- **PDF trail maps** — import a park/trail brochure PDF and it's overlaid,
  correctly rotated and scaled, on the real map. See
  [Trail maps](#trail-maps) below for how positioning works.
- **Installable** — add it to your Android home screen from Chrome for a
  standalone, full-screen app experience.

## Detail levels

Each level downloads extra zoom levels *beyond* whatever zoom you're
currently viewing at when you hit "Capture":

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

## Trail maps

Importing a PDF (**Capture** tab → **Add PDF map**) tries three ways, in
order, to figure out where it belongs on the real map:

1. **Embedded geospatial metadata** — a true "GeoPDF" with an Adobe `/VP`
   viewport dictionary (`GPTS`/`LPTS` corner points). Rare in practice, but
   exact when present.
2. **Auto-detected printed coordinates** — many park/trail brochures print a
   "GPS Coordinates" list (`Trailhead Name: lat, lon`) somewhere on the page.
   The app finds each named label's position on the map page itself and fits
   a transform from those points to get a good initial placement.
3. **Manual placement** — neither of the above panned out. The page is still
   rendered and dropped onto whatever the map is currently showing, ready for
   you to position by hand.

Whichever method ran, you always get exactly the same positioning
experience: a status line names what was actually detected (e.g. "Detected
3 GPS labels in this PDF (Castleridge Trailhead, Foothill Staging Area,
Tyler Ranch Staging Area) — used to estimate the initial position"), and the
same two kinds of handles appear on the map every time, regardless of what
the file provided:

- **Four small points, always at the same four spots** — one inset from
  each edge of the image. Drag any single one onto its true location — the
  others stay put, and the whole overlay reshapes (via an affine fit) to
  match. Any printed GPS labels auto-detect found are used only to compute a
  better *starting* position (and are named in the status line) — they're
  never used as the points' positions, so the interaction is identical
  whether a file has perfect embedded metadata, three printed landmark
  labels, or nothing at all. Using 4 points (rather than the minimum 3) also
  turns the fit into a genuine least-squares fit instead of one forced
  exactly through 3 points with no way to check itself — which means
  dragging one point can visibly nudge the others slightly too; that's the
  fit distributing its error, not a bug.
- **One large center handle** — drag it to slide the whole overlay as-is
  (pure translation, no reshaping). Use this first for a rough position, then
  the small points to fix any remaining rotation, scale, or skew.

The opacity slider (vertical, right edge of the screen) stays available
throughout, on every tab, whenever a trail map is on the map — not just
while positioning it — so you can see the base map through the overlay
while lining things up or just browsing.

Already-saved trail maps can be repositioned any time via **Adjust** in the
Offline tab's trail map list — it reuses whichever points you dragged last,
so repeated adjustments keep refining the same landmarks instead of starting
over from the image's edges.

## How it works

- Map tiles come from the [OpenStreetMap](https://www.openstreetmap.org/copyright)
  tile server.
- A Service Worker caches the app itself (so it loads instantly and works
  offline) and intercepts tile requests — serving cached tiles when you're
  offline, and refreshing them from the network when you're not.
- Region metadata (name, bounds, zoom range, size) is stored in IndexedDB;
  the actual tile images live in the browser's Cache Storage.
- PDF parsing and rendering runs entirely on-device via
  [MuPDF's WebAssembly build](https://mupdf.com/) (`vendor/mupdf.js`,
  `vendor/mupdf-wasm.*`) — the PDF never leaves the phone. The rendered page
  image and its georeferencing (corner coordinates, and the four control
  points used for re-adjustment) are stored in IndexedDB as an ordinary
  trail map record; the overlay itself is drawn with a vendored
  `Leaflet.ImageOverlay.Rotated` (`vendor/Leaflet.ImageOverlay.Rotated.js`),
  which supports the skew/rotation a plain image overlay can't.

## Requirements

Needs a host with **no restrictive Content-Security-Policy** on
`worker-src` or `connect-src` — Service Workers and cross-origin `fetch()`
both have to work normally. GitHub Pages, Cloudflare Pages, and Netlify all
work out of the box. (Neocities' free tier does not — its CSP blocks
Service Worker registration entirely.)

## Deploying (GitHub Pages)

1. Push these files to a repo: `index.html`, `manifest.json`,
   `service-worker.js`, `icon-192.png`, `icon-512.png`, and the `vendor/`
   folder (MuPDF WASM + the rotated image overlay plugin) alongside them.
2. Repo **Settings → Pages** → Source: "Deploy from a branch" → Branch:
   `main`, folder `/ (root)` → Save.
3. Visit `https://<username>.github.io/<repo>/` — confirm the status line
   under the Capture panel says "Offline support: ready."
4. In Chrome's menu, tap **Install app** to add it to your home screen.

## Installing a region for offline use

1. Open the app while you have a connection.
2. **Capture** tab → **Capture region** → pan/zoom the map (still live behind
   the form) to the area you want, zoom in for street-level detail if needed,
   pick a detail level, name it, tap **Capture**.
3. Switch to **Offline** tab any time afterward — tap the region to view it,
   even with no signal.

## Installing a trail map for offline use

1. **Capture** tab → **Add PDF map** → pick a PDF, then name it when
   prompted.
2. Confirm or drag the positioning handles into place (see
   [Trail maps](#trail-maps)), then **Save position**.
3. Switch to **Offline** tab any time afterward — tap **Open** to overlay it,
   or **Adjust** to reposition it, even with no signal (the PDF itself was
   only needed at import time; the saved trail map is just an image).

## Known limitations

- Tile downloads are paced (~60ms between requests) to stay reasonable
  against OpenStreetMap's free tile server — don't download excessively
  large regions.
- iOS Safari can evict cached data for web apps under storage pressure;
  Android/Chrome is more reliable, but nothing's guaranteed forever — redownload
  a region if it stops showing tiles offline.
- Coordinates are decimal degrees (WGS84), shown to 5 decimal places
  (~1 m precision) — though actual GPS accuracy is usually only ~5–10 m.
- Trail map auto-placement is a best-effort guess, not a guarantee — printed
  "GPS Coordinates" labels can be ambiguous to match on the page, and even a
  clean match only pins where the *label text* sits, not necessarily the
  actual trailhead/landmark it names, so the initial placement computed from
  it can be off by a meaningful amount. Always eyeball the positioning step
  before saving, and use **Adjust** later if it turns out to be off.
- With always 4 positioning points the fit is least-squares, not exact —
  dragging one point can visibly nudge the other three slightly too, since
  the transform is doing its best to satisfy all 4 at once rather than
  passing through each one exactly.
