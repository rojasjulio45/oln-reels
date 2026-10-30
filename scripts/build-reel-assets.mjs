// Builds the reel's visual assets into small JSON files so the video bundle
// stays light:
//  - src/reel/assets/icons.json: a subset of Fluent Emoji Flat (Microsoft, MIT)
//    from @iconify-json/fluent-emoji-flat.
//  - src/reel/assets/chile.json: Chile's mainland outline (Natural Earth via
//    world-atlas, public domain) projected to SVG, plus 346 points inside it,
//    one per comuna, ordered north to south.
// Usage: node scripts/build-reel-assets.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoContains, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src/reel/assets");
mkdirSync(outDir, { recursive: true });

const ICONS = [
  "child", "girl", "boy", "woman", "man", "people-hugging", "baby",
  "office-building", "classical-building", "house-with-garden", "houses", "school", "hospital",
  "balance-scale", "judge", "file-folder", "open-file-folder", "card-file-box", "page-with-curl", "scroll",
  "check-mark-button", "cross-mark", "prohibited", "megaphone", "umbrella", "shield", "door",
  "magnifying-glass-tilted-left", "clipboard", "handshake", "red-heart", "oncoming-police-car",
  "police-car-light", "warning", "collision", "high-voltage", "sparkles", "round-pushpin",
  "world-map", "speech-balloon", "left-speech-bubble", "backhand-index-pointing-down", "bookmark",
  "outbox-tray", "envelope-with-arrow", "hourglass-not-done", "spiral-calendar", "bell", "stethoscope",
  "graduation-cap", "books", "eyes", "person-raising-hand", "light-bulb", "fire", "telephone-receiver",
  "anxious-face-with-sweat", "smiling-face-with-smiling-eyes", "folded-hands", "link", "seedling",
];

const set = require("@iconify-json/fluent-emoji-flat/icons.json");
const icons = {};
const missing = [];
for (const name of ICONS) {
  const icon = set.icons[name] ?? set.icons[set.aliases?.[name]?.parent];
  if (!icon) {
    missing.push(name);
    continue;
  }
  icons[name] = { body: icon.body, w: icon.width ?? set.width, h: icon.height ?? set.height };
}
writeFileSync(path.join(outDir, "icons.json"), JSON.stringify(icons));
console.log(`icons: ${Object.keys(icons).length} (sin equivalente: ${missing.join(", ") || "ninguno"})`);

// Chile: keep mainland polygons (drop Easter Island, Juan Fernández, etc.).
const world = require("world-atlas/countries-50m.json");
const countries = feature(world, world.objects.countries);
const chile = countries.features.find((f) => f.id === "152");
const mainland = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "MultiPolygon",
    coordinates: chile.geometry.coordinates.filter((poly) => poly[0].every(([lon]) => lon > -77)),
  },
};
const W = 360;
const H = 1260;
const projection = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], mainland);
const d = geoPath(projection)(mainland);

// Deterministic pseudo-random points inside the mainland, one per comuna.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const [[lon0, lat0], [lon1, lat1]] = geoPath().bounds(mainland);
const points = [];
while (points.length < 346) {
  // Comunas cluster in the central valley: sample latitude with a bias towards it.
  const lat = lat0 + (lat1 - lat0) * Math.pow(rnd(), 0.85);
  const lon = lon0 + (lon1 - lon0) * rnd();
  if (geoContains(mainland, [lon, lat])) {
    const [x, y] = projection([lon, lat]);
    points.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
}
points.sort((a, b) => a[1] - b[1]);
const [mx, my] = projection([-70.65, -33.45]); // Santiago, for the "tu comuna" pin
writeFileSync(
  path.join(outDir, "chile.json"),
  JSON.stringify({ width: W, height: H, d, points, santiago: [Math.round(mx), Math.round(my)] }),
);
console.log(`chile: path ${Math.round(d.length / 1024)} KB, ${points.length} puntos`);
