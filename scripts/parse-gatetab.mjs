// Parses the official Bergen kommune gatetab.xls (street register) and
// writes a normalised JSON to public/data/bergen-gatetab.json. Run with:
//   npm run parse-gatetab
// The output is the authoritative list of street names the kommune
// recognises and is used to cross-check OSM coverage.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN = resolve(__dirname, "..", "data", "raw", "gatetab.xls");
const OUT = resolve(__dirname, "..", "public", "data", "bergen-gatetab.json");

const buf = readFileSync(IN);
const wb = XLSX.read(buf, { type: "buffer" });
console.log("Sheets:", wb.SheetNames);

const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
if (rows.length === 0) {
  console.error("No rows found in gatetab.xls");
  process.exit(1);
}

console.log("Row count:", rows.length);
console.log("Columns:", Object.keys(rows[0]));
console.log("Sample row:", rows[0]);

// Best-effort column detection. The kommune file historically uses headers
// in Norwegian (Gatenavn / Gatekode / Bydel / Postnr).
function pick(row, candidates) {
  for (const key of Object.keys(row)) {
    const norm = key.toLowerCase().replace(/[^a-z0-9æøå]/g, "");
    for (const c of candidates) {
      if (norm.includes(c)) return row[key];
    }
  }
  return "";
}

const entries = [];
const seen = new Set();
for (const row of rows) {
  const name = String(pick(row, ["gatenavn", "navn"])).trim();
  if (!name || name.toLowerCase() === "gatenavn") continue;
  const key = name.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  entries.push({
    name,
    code: String(pick(row, ["gatekode", "kode"])).trim() || null,
    bydel: String(pick(row, ["bydel"])).trim() || null,
    postnr: String(pick(row, ["postnr", "postnummer"])).trim() || null,
  });
}

entries.sort((a, b) => a.name.localeCompare(b.name, "no"));

const payload = {
  source: "Bergen kommune — gatetabell",
  parsedAt: new Date().toISOString(),
  count: entries.length,
  entries,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(payload));
console.log(`Wrote ${OUT} (${entries.length} unique streets)`);
