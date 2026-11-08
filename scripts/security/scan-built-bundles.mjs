#!/usr/bin/env node
// SEC-09/12: scan the built output for secrets that must never reach a browser or a shipped bundle.
//   node scripts/security/scan-built-bundles.mjs [dir ...]      (default: .next/static and .next/server)
// Exit 1 on any finding. Findings print the file, the rule and a masked sample, never the full value.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const RULES = [
  { id: "private-key-block", re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/ },
  { id: "aws-access-key-id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: "github-token", re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{50,}\b/ },
  { id: "stripe-live-key", re: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/ },
  { id: "slack-token", re: /\bxox[abprs]-[A-Za-z0-9-]{20,}\b/ },
  { id: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: "database-url-with-password", re: /\bpostgres(?:ql)?:\/\/[^\s:@/'"]+:[^\s@/'"]{3,}@[^\s'"]+/ },
  { id: "bearer-literal", re: /\bAuthorization["']?\s*[:=]\s*["']Bearer\s+[A-Za-z0-9._-]{24,}["']/ },
];

// Names that may never be exposed to the browser through NEXT_PUBLIC_.
export const SENSITIVE_PUBLIC_NAME = /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|PRIVATE|CREDENTIAL|API_KEY|ACCESS_KEY|HMAC)/;

const SKIP_EXT = /\.(?:png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|eot|mp4|webm|map|br|gz)$/i;
const MAX_BYTES = 8 * 1024 * 1024;

export function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (!SKIP_EXT.test(entry.name)) out.push(path);
  }
  return out;
}

const mask = (value) => (value.length <= 10 ? "***" : value.slice(0, 4) + "..." + value.slice(-2));

/** Pure scan of one file's text. `extraLiterals` are exact secret values to look for (from the environment). */
export function scanText(text, extraLiterals = []) {
  const findings = [];
  for (const rule of RULES) {
    const match = rule.re.exec(text);
    if (match) findings.push({ rule: rule.id, sample: mask(match[0]) });
  }
  const names = text.match(new RegExp(SENSITIVE_PUBLIC_NAME.source, "g"));
  if (names) findings.push({ rule: "sensitive-public-name", sample: [...new Set(names)].slice(0, 3).join(",") });
  for (const literal of extraLiterals) {
    if (literal && text.includes(literal)) findings.push({ rule: "secret-value-in-bundle", sample: mask(literal) });
  }
  return findings;
}

/** Exact values of secret-looking environment variables (24+ chars) present at build time. */
export function secretLiteralsFromEnv(env = process.env) {
  return Object.entries(env)
    .filter(([name, value]) => /SECRET|TOKEN|PASSWORD|PRIVATE_KEY|HMAC|API_KEY|ACCESS_KEY/.test(name) && typeof value === "string" && value.length >= 24)
    .map(([, value]) => value);
}

export function scanDirs(dirs, extraLiterals = []) {
  const results = [];
  let scanned = 0;
  for (const dir of dirs) {
    for (const file of walk(dir)) {
      let size = 0;
      try {
        size = statSync(file).size;
      } catch {
        continue;
      }
      if (size > MAX_BYTES) continue;
      const text = readFileSync(file, "utf8");
      scanned += 1;
      for (const finding of scanText(text, extraLiterals)) {
        results.push({ file: relative(process.cwd(), file).split(sep).join("/"), ...finding });
      }
    }
  }
  return { scanned, results };
}

if (import.meta.url === `file://${process.argv[1].split(sep).join("/")}` || process.argv[1]?.endsWith("scan-built-bundles.mjs")) {
  const dirs = process.argv.slice(2).length ? process.argv.slice(2) : [".next/static", ".next/server"];
  const { scanned, results } = scanDirs(dirs, secretLiteralsFromEnv());
  if (scanned === 0) {
    console.error("scan-built-bundles: nothing scanned in " + dirs.join(", ") + " (run the production build first)");
    process.exit(1);
  }
  if (results.length) {
    console.error("scan-built-bundles: secrets or sensitive names found in the build output:");
    for (const r of results.slice(0, 50)) console.error(`  ${r.file}  ${r.rule}  ${r.sample}`);
    process.exit(1);
  }
  console.log(`scan-built-bundles ok: ${scanned} files scanned, no secrets found`);
}
