#!/usr/bin/env node
/**
 * Chat 6 DB-008: deterministic source-only audit of DB05 SQL draft object names.
 * Run: node scripts/db05-sql-collision-audit.mjs [--json].
 *
 * This does NOT execute PostgreSQL or register migrations. It catches two
 * unregistered drafts accidentally defining the same object or column.
 * The single documented lesson-discussion tenant function override is
 * intentional: W01 must merge it ONCE, rather than applying two definitions.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const folder = resolve(root, "scripts/sql");
const paths = readdirSync(folder)
  .filter((name) => /^db05-.*\.draft\.sql$/.test(name))
  .sort()
  .map((name) => "scripts/sql/" + name);
const stripComments = (content) =>
  content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");
const patterns = {
  function: /\bCREATE\s+OR\s+REPLACE\s+FUNCTION\s+([a-z_][a-z0-9_]*)\s*\(/gi,
  trigger: /\bCREATE\s+TRIGGER\s+([a-z_][a-z0-9_]*)\b/gi,
  index: /\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\b/gi,
  constraint: /\bADD\s+CONSTRAINT\s+([a-z_][a-z0-9_]*)\b/gi,
};
const documentedOverrides = new Map([[
  "function:db05_lesson_discussions_tenant_guard",
  [
    "scripts/sql/db05-lesson-content-discussions.draft.sql",
    "scripts/sql/db05-lesson-discussions-same-college.draft.sql",
  ],
]]);
const occurrenceByKey = new Map();
const sqlByFile = new Map();
function addOccurrence(kind, name, file) {
  const key = kind + ":" + name.toLowerCase();
  occurrenceByKey.set(key, [...(occurrenceByKey.get(key) || []), file]);
}
for (const file of paths) {
  const sql = stripComments(readFileSync(resolve(root, file), "utf8"));
  sqlByFile.set(file, sql);
  for (const [kind, expression] of Object.entries(patterns)) {
    for (const hit of sql.matchAll(expression)) {
      addOccurrence(kind, hit[1], file);
    }
  }
  // One ALTER TABLE can contain multiple ADD COLUMN declarations. Columns
  // are keyed by table, not by column name alone.
  const alters = /\bALTER\s+TABLE\s+([a-z_][a-z0-9_]*)\s+([\s\S]*?);/gi;
  for (const alter of sql.matchAll(alters)) {
    const table = alter[1].toLowerCase();
    const addColumn = /\bADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]*)\b/gi;
    for (const column of alter[2].matchAll(addColumn)) {
      addOccurrence("column", table + "." + column[1].toLowerCase(), file);
    }
  }
}

const errors = [];
const intentionalOverrides = [];
const collisions = [];
for (const [key, files] of occurrenceByKey) {
  if (files.length <= 1) continue;
  const expected = documentedOverrides.get(key);
  if (expected && files.length === expected.length &&
      [...files].sort().join("|") === [...expected].sort().join("|")) {
    intentionalOverrides.push({ object: key, definitions: files });
  } else {
    collisions.push({ object: key, definitions: files });
    errors.push("Duplicate DB05 SQL object: " + key + " in " + files.join(", "));
  }
}
// Drift protection: remove a stale exception rather than silently treating
// any future single definition as a verified intentional override.
for (const [key, expected] of documentedOverrides) {
  const files = occurrenceByKey.get(key) || [];
  if (files.length !== expected.length ||
      [...files].sort().join("|") !== [...expected].sort().join("|")) {
    errors.push("Expected documented override changed: " + key);
  }
}
const manifest = JSON.parse(readFileSync(resolve(
  root, "docs/planning/db05-migration-readiness-manifest.json"), "utf8"));
const registeredPaths = new Set([
  ...manifest.artifacts.map((item) => item.path),
  ...(manifest.crossDomainCompanions || []).map((item) => item.path),
]);
for (const artifact of manifest.artifacts) {
  for (const key of [
    "companionIntegrityDraft", "companionSameCollegeDraft",
    "companionUpstreamDepartmentDraft",
  ]) {
    if (artifact[key]?.path) registeredPaths.add(artifact[key].path);
  }
}
for (const entry of registeredPaths) {
  if (entry.endsWith(".draft.sql") && !existsSync(resolve(root, entry))) {
    errors.push("Manifest references missing DB05 draft: " + entry);
  }
}
const unlistedDrafts = paths.filter((path) => !registeredPaths.has(path));
const counts = Object.fromEntries(Object.keys(patterns).concat("column").map((kind) =>
  [kind, [...occurrenceByKey.keys()].filter((key) => key.startsWith(kind + ":")).length]));
const report = {
  taskId: "DB-008",
  sourceOnly: true,
  postgresqlExecuted: false,
  sqlDraftsScanned: paths.length,
  objectCounts: counts,
  collisions,
  intentionalOverrides,
  unlistedDrafts,
  errors,
  pass: errors.length === 0,
  caution: "No SQL parser/runtime or PostgreSQL replay; named-object scan only. Unlisted drafts are review candidates, not registered migrations.",
};
if (process.argv.includes("--json")) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  process.stdout.write("DB05 draft-name collisions: " + collisions.length +
    ", intentional function overrides: " + intentionalOverrides.length +
    ", scanned: " + paths.length + " drafts\n");
  if (errors.length) process.stdout.write(errors.join("\n") + "\n");
  if (unlistedDrafts.length) process.stdout.write(
    "Unlisted conditional/companion drafts: " + unlistedDrafts.join(", ") + "\n");
}
if (!report.pass) process.exitCode = 1;
