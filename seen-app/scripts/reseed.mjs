/**
 * Clears the local JSON store so the next server boot reseeds from scratch.
 * Usage: npm run seed   (then restart `npm run dev`)
 */
import { rmSync } from "node:fs";

for (const path of [".data/seen.json", ".data/analytics.json"]) {
  rmSync(path, { force: true });
}

console.log("Seen store cleared. Restart the dev server (npm run dev) to reseed 96 storefronts.");
