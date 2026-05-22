# Blue Book Bergen

A "Knowledge"-style training game for memorising the streets of Bergen,
Norway. Inspired by the famous test London cab drivers sit before they
get a licence — but for Bergen Sentrum and surrounds.

Light theme, hyper-minimal, no accounts. Every mode supports a sub-area
("bydel") filter so you can practise just Nordnes, Sandviken,
Møhlenpris, or the whole bbox.

1. **Locate the street** — name is shown, click where it is.
2. **Pin the address** — landmark is shown, drop a pin on the exact spot.
3. **Name the street** — street is highlighted, type its name.
4. **Multiple choice** — street is highlighted, pick the name from four.
5. **Plan the route** — A → B, list the streets you'd drive (routed
   against the public OSRM router for ground truth).
6. **Explore the map** — free-roam, toggle the street labels on/off.
7. **Streets** — searchable index, traced on the map.

## Stack

- Next.js 15 App Router · React 18 · TypeScript
- Tailwind CSS (light theme, custom Bergen palette)
- React-Leaflet on CARTO Light tiles, OpenStreetMap data
- `lucide-react` icons
- Street data fetched once from the OpenStreetMap Overpass API and shipped
  as a static JSON file in `public/data/bergen.json` (~8.7 MB, ~3,200
  streets, ~430 POIs) covering the entire kommune.
- Official kommune street register parsed from `data/raw/gatetab.xls`
  into `public/data/bergen-gatetab.json` (1,935 streets with bydel).
  Used at load time to tag each OSM street with its bydel so the
  area filter is bydel-accurate.

No API key required.

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
```

To refresh the datasets:

```bash
npm run fetch-data       # OSM streets + POIs via Overpass
npm run parse-gatetab    # kommune gatetabell from data/raw/gatetab.xls
```

## Deploy to Vercel

```bash
vercel
```

The repo is plain Next.js — Vercel detects it automatically. No env vars
needed.

## Data

- Streets and POIs are fetched from
  [Overpass](https://overpass-api.de/) inside a bounding box that covers
  the whole Bergen kommune. Adjust `BBOX` in
  `scripts/fetch-bergen-data.mjs` to broaden or narrow it.
- The kommune gatetabell lives in `data/raw/gatetab.xls`; `parse-gatetab`
  produces `public/data/bergen-gatetab.json` which the app merges into
  the OSM data at load time so each street carries its official bydel.
- Routes are computed live by the public OSRM demo server
  (`router.project-osrm.org`), which is fine for a hobby app but not
  rate-limit guaranteed.
- Street data © OpenStreetMap contributors, ODbL. Map tiles by CARTO.
