// Fetches all named streets (and select POIs) inside the Bergen Sentrum
// bounding box from the OpenStreetMap Overpass API and writes a slim
// JSON file used by the game. Run with: `npm run fetch-data`.
//
// Bounding box covers Bergen Sentrum + Nordnes + Sandviken + Møhlenpris +
// parts of Årstad. Adjust the BBOX below if you want more/less coverage.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "public", "data", "bergen.json");

// south, west, north, east. Covers all eight Bergen kommune bydeler:
// Bergenhus, Årstad, Laksevåg, Fyllingsdalen, Ytrebygda, Fana, Arna,
// Åsane. Yields ~1900 streets, ~750 POIs.
const BBOX = [60.180, 5.050, 60.560, 5.550];

const ENDPOINT = "https://overpass-api.de/api/interpreter";

const STREET_QUERY = `[out:json][timeout:240];
(
  way[highway][name](${BBOX.join(",")});
);
out body;
>;
out skel qt;`;

function poiQuery(box) {
  const b = box.join(",");
  return `[out:json][timeout:90];
(
  node[amenity~"^(university|college|hospital|theatre|townhall|library|cinema|police|fire_station|place_of_worship)$"][name](${b});
  node[tourism~"^(museum|attraction|viewpoint|gallery|hotel)$"][name](${b});
  node[railway~"^(station|tram_stop)$"][name](${b});
  node[public_transport=station][name](${b});
  node[amenity=bus_station][name](${b});
  node[place~"^(square|neighbourhood|suburb)$"][name](${b});
);
out body;`;
}

function splitBbox(box) {
  const [s, w, n, e] = box;
  const midLat = (s + n) / 2;
  const midLon = (w + e) / 2;
  return [
    [s, w, midLat, midLon],
    [s, midLon, midLat, e],
    [midLat, w, n, midLon],
    [midLat, midLon, n, e],
  ];
}

async function overpass(query) {
  const url = `${ENDPOINT}?data=${encodeURIComponent(query)}`;
  console.log(`-> GET ${ENDPOINT} (query ${query.length} chars)`);
  const res = await fetch(url, {
    headers: { "User-Agent": "BlueBookBergen/1.0 (https://github.com/egil10/bluebookbergen)" },
  });
  if (!res.ok) throw new Error(`Overpass failed: ${res.status} ${res.statusText}`);
  return res.json();
}

function buildStreets(raw) {
  const nodes = new Map();
  for (const el of raw.elements) {
    if (el.type === "node") nodes.set(el.id, [el.lat, el.lon]);
  }
  const byName = new Map();
  for (const el of raw.elements) {
    if (el.type !== "way" || !el.tags?.name) continue;
    const name = el.tags.name;
    const coords = (el.nodes || [])
      .map((id) => nodes.get(id))
      .filter(Boolean);
    if (coords.length < 2) continue;
    const seg = { id: el.id, coords };
    if (!byName.has(name)) {
      byName.set(name, {
        name,
        highway: el.tags.highway,
        oneway: el.tags.oneway === "yes",
        segments: [seg],
      });
    } else {
      byName.get(name).segments.push(seg);
    }
  }
  // sort + compute centroid for each street
  const streets = [...byName.values()]
    .map((s) => {
      let lat = 0, lon = 0, n = 0;
      for (const seg of s.segments) {
        for (const [a, b] of seg.coords) {
          lat += a; lon += b; n++;
        }
      }
      return { ...s, center: [lat / n, lon / n] };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "no"));
  return streets;
}

function buildPois(raw) {
  const out = [];
  for (const el of raw.elements) {
    if (el.type !== "node" || !el.tags?.name) continue;
    const kind =
      el.tags.tourism || el.tags.amenity || el.tags.railway || el.tags.place || "poi";
    out.push({
      id: el.id,
      name: el.tags.name,
      kind,
      lat: el.lat,
      lon: el.lon,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name, "no"));
  return out;
}

async function main() {
  console.log("Fetching streets...");
  const streetsRaw = await overpass(STREET_QUERY);
  console.log(`  raw elements: ${streetsRaw.elements.length}`);
  const streets = buildStreets(streetsRaw);
  console.log(`  unique streets: ${streets.length}`);

  console.log("Fetching POIs (quadrants)...");
  const quads = splitBbox(BBOX);
  const merged = { elements: [] };
  for (const [i, q] of quads.entries()) {
    console.log(`  quadrant ${i + 1}/4 ${q.join(",")}`);
    let raw;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        raw = await overpass(poiQuery(q));
        break;
      } catch (e) {
        console.warn(`    attempt ${attempt} failed: ${e.message}`);
        if (attempt === 3) throw e;
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    merged.elements.push(...raw.elements);
  }
  const pois = buildPois(merged);
  console.log(`  POIs: ${pois.length}`);

  const payload = {
    bbox: BBOX,
    fetchedAt: new Date().toISOString(),
    streets,
    pois,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload));
  console.log(`Wrote ${OUT} (${(JSON.stringify(payload).length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
