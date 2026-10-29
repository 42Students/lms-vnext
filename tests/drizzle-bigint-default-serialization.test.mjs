import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { test } from "node:test";

/** Fail-closed source guard for drizzle-kit 0.31.x JSON BigInt default bug.
 * Prefer sql`0` / sql`1` while preserving PostgreSQL BIGINT and BigInt read mode.
 * Source-level checks do not substitute for migration replay. */
const schemaRoot = resolve("src/db/schema");
const nativeDefault = /\.default\s*\(\s*(?:[-+]?\d[\d_]*n\b|BigInt\s*\()/g;

function schemaFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return schemaFiles(fullPath);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [fullPath] : [];
  });
}

function offendingDefaults(source) {
  return [...source.matchAll(nativeDefault)].map(match => ({
    line: source.slice(0, match.index).split("\n").length,
    expression: match[0],
  }));
}

test("guard detects native BigInt defaults without rejecting SQL literal defaults", () => {
  assert.equal(offendingDefaults("bigint('v',{mode:'bigint'}).default(0n)").length, 1);
  assert.equal(offendingDefaults("bigint('v',{mode:'bigint'}).default(1_000n)").length, 1);
  assert.equal(offendingDefaults("bigint('v',{mode:'bigint'}).default(BigInt(5))").length, 1);
  assert.deepEqual(offendingDefaults("bigint('v',{mode:'bigint'}).default(sql`0`)"), []);
  assert.deepEqual(offendingDefaults("bigint('v',{mode:'number'}).default(0)"), []);
});

test("schema files never feed native JS BigInt defaults to Drizzle Kit generation", () => {
  const defects = [];
  for (const file of schemaFiles(schemaRoot)) {
    const source = readFileSync(file, "utf8");
    for (const hit of offendingDefaults(source))
      defects.push(relative(process.cwd(), file) + ":" + hit.line + ": " + hit.expression);
  }
  assert.deepEqual(defects, [],
    "Use a SQL-tagged integer default while preserving PostgreSQL BIGINT semantics");
});
