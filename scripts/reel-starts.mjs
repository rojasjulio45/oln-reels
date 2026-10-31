import { buildSync } from "esbuild";
import os from "node:os"; import path from "node:path"; import { pathToFileURL } from "node:url";
const tmp = path.join(os.tmpdir(), `reel-script-x.mjs`);
buildSync({ entryPoints: ["/home/user/oln-reels/src/reel/script.ts"], bundle: true, format: "esm", platform: "node", outfile: tmp, logLevel: "error" });
const reel = await import(pathToFileURL(tmp).href);
for (const v of ["linkedin","instagram"]) { const s = reel.getBeatStarts(v); console.log(v, JSON.stringify(s), "total", reel.getVariantDuration(v)); }
