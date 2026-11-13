// One home and one reader for every ratchet baseline (docs/security/baselines/*.json).
// Scripts ask for a baseline by name; nobody builds the path by hand, so moving the folder is a one-line change.
import fs from "node:fs";
import path from "node:path";

export const BASELINE_DIR = "docs/security/baselines";

export function baselinePath(name) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error(`Invalid baseline name: ${name}`);
  return path.posix.join(BASELINE_DIR, `${name}.json`);
}

export function readBaseline(name) {
  return JSON.parse(fs.readFileSync(baselinePath(name), "utf8"));
}

export function writeBaseline(name, value) {
  fs.writeFileSync(baselinePath(name), JSON.stringify(value, null, 2) + "\n");
}

export function baselineNames() {
  return fs.readdirSync(BASELINE_DIR).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
}
