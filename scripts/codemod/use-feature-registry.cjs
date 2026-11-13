#!/usr/bin/env node
// Rewrites `env.FLAG === "VALUE"` / `env.FLAG !== "VALUE"` (from the central env reader) to `featureReady("key")` /
// `!featureReady("key")`, using src/config/features.ts as the single table of expected values. Only comparisons whose literal
// equals the registered value are rewritten; anything else is reported and left for a person to look at.
//
//   node scripts/codemod/use-feature-registry.cjs [--dry]
const { execSync } = require("child_process");
const fs = require("fs");

const dry = process.argv.includes("--dry");
const table = fs.readFileSync("src/config/features.ts", "utf8");
const features = [...table.matchAll(/^\s{2}(\w+): \{ flag: "([A-Z0-9_]+)", on: "([^"]+)"/gm)].map((m) => ({ key: m[1], flag: m[2], on: m[3] }));
const byFlag = new Map(features.map((f) => [f.flag, f]));

const files = execSync("git ls-files src", { encoding: "utf8" }).split("\n").filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith("src/config/"));
const COMPARE = /\b(env|appEnv)\.([A-Z][A-Z0-9_]*)\s*(===|!==)\s*(["'])([^"']*)\4/g;
let changed = 0;
let rewritten = 0;
const mismatched = [];

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  if (!/\b(?:env|appEnv)\.[A-Z]/.test(raw)) continue;
  const crlf = raw.includes("\r\n");
  const text = crlf ? raw.split("\r\n").join("\n") : raw;
  let count = 0;
  const out = text.split("\n").map((line) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return line;
    return line.replace(COMPARE, (match, _id, flag, op, _q, value) => {
      const feature = byFlag.get(flag);
      if (!feature) return match;
      if (value !== feature.on) {
        mismatched.push(`${file}: ${flag} ${op} "${value}" (registered "${feature.on}")`);
        return match;
      }
      count += 1;
      return `${op === "===" ? "" : "!"}featureReady("${feature.key}")`;
    });
  });
  if (count === 0) continue;
  let result = out.join("\n");

  // Add the featureReady import after the last import.
  const imports = [...result.matchAll(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?\s*$|^import\s+["'][^"']+["'];?\s*$/gm)];
  const importLine = 'import { featureReady } from "@/config/features";';
  if (imports.length) {
    const last = imports[imports.length - 1];
    const at = last.index + last[0].length;
    result = result.slice(0, at) + "\n" + importLine + result.slice(at);
  } else {
    result = importLine + "\n" + result;
  }

  // Drop `env` / `appEnv` from the config import when nothing uses it any more.
  result = result.replace(/^import \{ ([^}]*) \} from "@\/config\/env";\n/m, (whole, list) => {
    const bindings = list.split(",").map((s) => s.trim()).filter(Boolean);
    const stripped = result.replace(whole, "");
    const kept = bindings.filter((binding) => {
      const local = binding.includes(" as ") ? binding.split(" as ")[1].trim() : binding;
      const used = new RegExp("(?<![\\w$.\"'])" + local + "(?![\\w$\"'])").test(stripped.replace(/^\s*(\/\/|\*|\/\*).*$/gm, ""));
      return used;
    });
    return kept.length ? `import { ${kept.join(", ")} } from "@/config/env";\n` : "";
  });

  changed += 1;
  rewritten += count;
  if (!dry) fs.writeFileSync(file, crlf ? result.split("\n").join("\r\n") : result);
}

console.log(`${dry ? "would change" : "changed"} ${changed} files, ${rewritten} comparisons`);
if (mismatched.length) console.log("compared against a value other than the registered one (left alone):\n  " + mismatched.join("\n  "));
