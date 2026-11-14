#!/usr/bin/env node
// Runs only the quarantined UI-copy tests (tests/quarantine/ui-copy-drift.json), which `npm test` skips.
// They are expected to fail until their owners repair them; this command shows the current state.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const { files } = JSON.parse(readFileSync("tests/quarantine/ui-copy-drift.json", "utf8"));
if (files.length === 0) {
  console.log("quarantine is empty");
  process.exit(0);
}
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", ...files.map((entry) => entry.file)], {
  stdio: "inherit",
  env: { ...process.env, INCLUDE_QUARANTINE: "1" },
});
process.exit(result.status ?? 1);
