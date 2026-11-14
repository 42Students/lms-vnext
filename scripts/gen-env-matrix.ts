// Generates docs/security/ENVIRONMENT-MATRIX.md from the typed config (src/config). Run: npx tsx scripts/gen-env-matrix.ts
import { writeFileSync } from "node:fs";
import { ENV_GROUP, ENV_KIND, ENV_NAMES } from "../src/config/env-names";
import { FEATURES } from "../src/config/features";

const flagValue = new Map<string, { on: string; area: string; harness: boolean }>();
for (const f of Object.values(FEATURES)) flagValue.set(f.flag, { on: f.on, area: f.area, harness: "harness" in f });

const rows = [...ENV_NAMES].sort((a, b) => (ENV_GROUP[a] + a).localeCompare(ENV_GROUP[b] + b));
const lines: string[] = [];
lines.push("# Environment matrix", "");
lines.push("Generated from `src/config/env-names.ts` and `src/config/features.ts` by `npx tsx scripts/gen-env-matrix.ts`. Do not edit by hand:");
lines.push("`tests/unit/sec-env-matrix.test.ts` fails when this file is out of date.", "");
lines.push("- **secret**: a credential or key. Set in the deployment's secret store, never in a repository, image or log.");
lines.push("- **flag**: a readiness switch. On only for the exact value shown; anything else (including unset) is off.");
lines.push("- **setting**: ordinary configuration.", "");
lines.push("| Variable | Kind | Group | Exact value that turns it on | Notes |", "|---|---|---|---|---|");
for (const name of rows) {
  const flag = flagValue.get(name);
  const notes = flag?.harness ? "Test harness. Must NEVER be set in production." : flag ? `Feature area: ${flag.area}` : "";
  lines.push(`| \`${name}\` | ${ENV_KIND[name]} | ${ENV_GROUP[name]} | ${flag ? "`" + flag.on + "`" : ""} | ${notes} |`);
}
lines.push("");
lines.push(`${rows.length} variables: ${rows.filter((n) => ENV_KIND[n] === "secret").length} secrets, ${rows.filter((n) => ENV_KIND[n] === "flag").length} flags, ${rows.filter((n) => ENV_KIND[n] === "setting").length} settings.`);
lines.push("");
writeFileSync("docs/security/ENVIRONMENT-MATRIX.md", lines.join("\n"));
console.log("wrote docs/security/ENVIRONMENT-MATRIX.md", rows.length);
