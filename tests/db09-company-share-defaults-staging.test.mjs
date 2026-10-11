import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const placements = readFileSync("src/db/schema/placements.ts", "utf8");
const collaboration = readFileSync("src/db/schema/tpo-collaboration.ts", "utf8");
const sourceRef = readFileSync(
  "docs/planning/sql/db09-company-export-preference-candidate.sql",
  "utf8",
);
const ledger = JSON.parse(
  readFileSync("docs/planning/database-parity-db09-field-ledger.json", "utf8"),
);
const contract = readFileSync(
  "docs/planning/database-parity-db09-company-share-defaults.md",
  "utf8",
);
const manifest = readFileSync(
  "docs/planning/db09-integration-manifest-2026-10-11.md",
  "utf8",
);

const allowed = [
  "name",
  "roll",
  "branch",
  "cgpa",
  "tenth",
  "twelfth",
  "email",
  "phone",
  "resume",
  "projects",
  "skillMatch",
  "stage",
];

test("DB047 canonical relationship schema owns share_column_defaults exactly once", () => {
  assert.equal(
    placements.split('shareColumnDefaults: jsonb("share_column_defaults")').length - 1,
    1,
  );
  assert.equal(
    placements.split("placement_company_relationships_share_columns_ck").length - 1,
    1,
  );
  assert.match(placements, /jsonb_typeof\(\$\{table\.shareColumnDefaults\}\) = 'array'/);
  assert.match(placements, /\$\{table\.shareColumnDefaults\} <@/);
});

test("DB047 canonical schema uses exactly the source-backed 12-column vocabulary", () => {
  const relationshipStart = placements.indexOf(
    "export const placementCompanyRelationships =",
  );
  const relationshipEnd = placements.indexOf(
    "export const placementRecruiterProfiles =",
    relationshipStart,
  );
  const block = placements.slice(relationshipStart, relationshipEnd);
  for (const column of allowed) {
    assert.match(block, new RegExp('"' + column + '"'));
  }
  const array = block.match(/'\[([^']+)\]'::jsonb/)?.[1] ?? "";
  const parsed = JSON.parse("[" + array + "]");
  assert.deepEqual(parsed, allowed);
});

test("DB047 source-reference SQL cannot become a second ALTER migration", () => {
  assert.match(sourceRef, /SOURCE REFERENCE ONLY/);
  assert.match(sourceRef, /NO DDL/);
  assert.match(sourceRef, /Do NOT register this file as a post-create ALTER/);
  assert.doesNotMatch(sourceRef, /^ALTER TABLE/m);
  assert.doesNotMatch(sourceRef, /^CREATE TABLE/m);
});

test("DB047 ledger disposition targets the canonical relationship column", () => {
  const row = ledger.records.find(
    (record) => record.id === "DB09-INDUSTRY_COMPANY-12",
  );
  assert.ok(row);
  assert.equal(row.status, "REDESIGNED");
  assert.deepEqual(row.mappingTarget, {
    table: "placement_company_relationships",
    column: "share_column_defaults",
    status: "STAGED_REDESIGN_UNVERIFIED",
  });
  assert.equal(row.tenantKey, "placement_company_relationships.college_id + company_id");
  assert.deepEqual(row.dbTestEvidence, []);
  assert.deepEqual(row.workflowEvidence, []);
});

test("DB047 keeps relationship defaults separate from immutable share snapshots", () => {
  assert.match(
    collaboration,
    /export const placementTpoShareLinks = pgTable/,
  );
  assert.match(collaboration, /columns: jsonb\("columns"\)/);
  assert.doesNotMatch(
    collaboration,
    /shareColumnDefaults: jsonb\("share_column_defaults"\)/,
  );
  assert.match(
    contract,
    /actual secure share remains an immutable snapshot/i,
  );
});

test("DB047 contract does not invent a live legacy default consumer", () => {
  assert.match(
    contract,
    /does \*\*not\*\* claim a currently live producer\/consumer/i,
  );
  assert.match(
    contract,
    /current runtime producer\/consumer where source evidence did not prove one/i,
  );
});

test("DB047 integration handoff must prefer Drizzle structural source", () => {
  assert.match(
    manifest,
    /Company relationship share defaults/i,
  );
  assert.match(
    manifest,
    /src\/db\/schema\/placements\.ts/,
  );
  assert.match(
    manifest,
    /shareColumnDefaults|share_column_defaults/,
  );
  assert.match(
    manifest,
    /do not register|Do not register/i,
  );
});

test("DB047 remains source-complete but unverified", () => {
  assert.match(contract, /not registered or PostgreSQL verified/i);
  assert.match(contract, /does not constitute PostgreSQL\/runtime verification/i);
  assert.equal(ledger.verifiedFieldCount, 0);
});
