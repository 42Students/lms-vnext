import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// A malformed inline comment once swallowed this live index declaration,
// leaving generated Drizzle snapshots without a registered PostgreSQL index.
test("DB020 college organization index is executable schema, not a comment", () => {
  const source = readFileSync("src/db/schema/colleges.ts", "utf8")
    .replace(/\/\/[^\n]*/g, "");
  const definitions = [...source.matchAll(/\bindex\("colleges_organization_idx"\)\.on\(table\.organizationId\)/g)];
  assert.equal(definitions.length, 1, "expected exactly one live organization index");
  assert.match(source, /index\("colleges_organization_status_idx"\)\.on\(/);
});
