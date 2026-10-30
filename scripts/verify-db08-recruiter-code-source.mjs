#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();

function tsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...tsFiles(full));
    } else if (entry.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

function hrHits(files) {
  const hits = [];
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((text, index) => {
      if (/\bHR\b/.test(text)) {
        hits.push({
          file: relative(root, file).replaceAll("\\", "/"),
          line: index + 1,
          text: text.trim(),
        });
      }
    });
  }
  return hits;
}

const schemaFiles = tsFiles(resolve("src/db/schema"));
const placementFiles = tsFiles(resolve("src/modules/placements"));
assert.ok(schemaFiles.length >= 50, "schema sweep unexpectedly small");
assert.ok(placementFiles.length >= 50, "placements module sweep unexpectedly small");

const schemaHits = hrHits(schemaFiles);
const placementHits = hrHits(placementFiles);
const allHits = [...schemaHits, ...placementHits];

const allowedFiles = new Set([
  "src/db/schema/placements.ts",
  "src/modules/placements/result-service.ts",
  "src/modules/placements/round-result-source-model.ts",
]);
assert.deepEqual(
  [...new Set(allHits.map((hit) => hit.file).filter((file) => !allowedFiles.has(file)))],
  [],
  "unexpected HR literal outside the known pre-cutover round-result family",
);

const placements = readFileSync(resolve("src/db/schema/placements.ts"), "utf8");
const resultService = readFileSync(
  resolve("src/modules/placements/result-service.ts"),
  "utf8",
);
const sourceModel = readFileSync(
  resolve("src/modules/placements/round-result-source-model.ts"),
  "utf8",
);
const candidate = readFileSync(
  resolve("docs/planning/sql/db08-recruiter-round-result-code-candidate.sql"),
  "utf8",
);
const inventory = JSON.parse(
  readFileSync(
    resolve("docs/planning/db-pass4-columns-db08_placement_policy_and_outcomes.json"),
    "utf8",
  ),
);
const roundTable = inventory.tables.find((table) => table.table === "round_result");
assert.ok(roundTable, "frozen round_result inventory missing");
const sourceField = roundTable.rows.find((row) => row.legacyColumn === "source");
assert.ok(sourceField, "frozen round_result.source field missing");
for (const source of ["HR", "PANELIST", "DRIVE_DAY", "EXCEL", "TPO"]) {
  assert.match(sourceField.sourceDefinition, new RegExp(source));
}

// Old writer remains required until the DB072 EXPAND migration is registered.
const preCutover = /source:\s*recruiterCanStage\s*\?\s*"HR"/.test(resultService);
assert.match(sourceModel, /source === "HR" \|\| source === "RECRUITER"/);
assert.match(resultService, /!isRecruiterRoundResultSource\(current\.source\)/);
assert.ok(placementHits.some(hit => hit.file === "src/modules/placements/round-result-source-model.ts"),
  "the compatibility model must explicitly recognize legacy HR provenance");
if (preCutover) {
  assert.equal(schemaHits.length, 1);
  assert.equal(schemaHits[0].file, "src/db/schema/placements.ts");
  assert.match(schemaHits[0].text, /'TPO', 'HR', 'IMPORT'/);
  assert.ok(placementHits.some(hit =>
    hit.file === "src/modules/placements/result-service.ts" && /"HR"/.test(hit.text)),
    "legacy writer must remain until the forward-compatible EXPAND migration is registered");
} else {
  // Do not accept a new RECRUITER writer against an old-only CHECK.
  assert.match(placements, /source} in \([^)]*'RECRUITER'[^)]*\)/s);
  assert.match(resultService, /source:\s*recruiterCanStage\s*\?\s*"RECRUITER"/);
}

const expandAt = candidate.indexOf("-- === DB072 EXPAND");
const finalizeAt = candidate.indexOf("-- === DB072 FINALIZE");
assert.ok(expandAt >= 0 && finalizeAt > expandAt);
const expand = candidate.slice(expandAt, finalizeAt);
const finalize = candidate.slice(finalizeAt);

assert.match(expand, /'HR'/);
assert.match(expand, /'RECRUITER'/);
assert.doesNotMatch(expand, /UPDATE placement_round_results[\s\S]*SET source='RECRUITER'/);

assert.match(finalize, /SET source='RECRUITER'[\s\S]*WHERE source='HR'/);
assert.match(finalize, /WHERE source='HR'/);
assert.match(finalize, /'PANELIST'/);
assert.match(finalize, /'DRIVE_DAY'/);
assert.match(finalize, /'IMPORT'/);

const strictStart = finalize.lastIndexOf(
  "ADD CONSTRAINT placement_round_results_source_ck",
);
const strictEnd = finalize.indexOf(
  "DO $db072_finalize_postcheck$",
  strictStart,
);
assert.ok(strictStart >= 0 && strictEnd > strictStart);
const strictCheck = finalize.slice(strictStart, strictEnd);
assert.doesNotMatch(
  strictCheck,
  /'HR'/,
  "strict final CHECK must not retain HR",
);

process.stdout.write(
  JSON.stringify(
    {
      task: "DB-072",
      status: "SOURCE_ASSERTIONS_PASSED",
      phase: preCutover ? "PRE_API_CUTOVER" : "POST_API_CUTOVER",
      schemaFiles: schemaFiles.length,
      placementFiles: placementFiles.length,
      hrHits: allHits,
      finalVocabulary: [
        "TPO",
        "RECRUITER",
        "PANELIST",
        "DRIVE_DAY",
        "IMPORT",
      ],
    },
    null,
    2,
  ) + "\n",
);
