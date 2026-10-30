// DB-072 / Chat 3 — final recruiter code + result provenance contract.
//
// Static:
//   node --test tests/db08-recruiter-code-contract.test.mjs
//
// Disposable PostgreSQL:
//   DB08_RECRUITER_CODE_DISPOSABLE=I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA \
//   TEST_DATABASE_URL=postgres://... \
//   node --test tests/db08-recruiter-code-contract.test.mjs
//
// File presence is not execution evidence.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

const candidate = readFileSync(
  resolve("docs/planning/sql/db08-recruiter-round-result-code-candidate.sql"),
  "utf8",
);
const verifier = readFileSync(
  resolve("scripts/verify-db08-recruiter-code-source.mjs"),
  "utf8",
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
const todayResultsService = readFileSync(
  resolve("src/modules/placements/recruiter-today-staged-results-service.ts"),
  "utf8",
);

function sections() {
  const expandAt = candidate.indexOf("-- === DB072 EXPAND");
  const finalizeAt = candidate.indexOf("-- === DB072 FINALIZE");
  assert.ok(expandAt >= 0 && finalizeAt > expandAt);
  return {
    expand: candidate.slice(expandAt, finalizeAt),
    finalize: candidate.slice(finalizeAt),
  };
}

test("DB-072 source sweep currently identifies the known HR family only", () => {
  const schemaStart = placements.indexOf("export const placementRoundResults");
  const schemaEnd = placements.indexOf("export const placementOffers", schemaStart);
  const roundResults = placements.slice(schemaStart, schemaEnd);

  // This test intentionally accepts pre-cutover OR future post-cutover source.
  // Read-side compatibility is safe before EXPAND: the writer must continue
  // emitting HR until the numbered migration accepts RECRUITER. In both
  // phases the conflict guard recognizes historic recruiter-owned rows.
  const reader = /!isRecruiterRoundResultSource\(current\.source\)/.test(resultService) &&
    /source === "HR" \|\| source === "RECRUITER"/.test(sourceModel);
  const pre = /'TPO', 'HR', 'IMPORT'/.test(roundResults) &&
    /source:\s*recruiterCanStage\s*\?\s*"HR"/.test(resultService);
  const post = /'RECRUITER'/.test(roundResults) &&
    /source:\s*recruiterCanStage\s*\?\s*"RECRUITER"/.test(resultService);
  assert.ok(reader && (pre || post),
    "round-result provenance writer, reader, or DB CHECK is in an unexplained intermediate state");
  assert.match(verifier, /src\/db\/schema/);
  assert.match(verifier, /src\/modules\/placements/);
});

test("DB-072 recruiter Today read includes old HR and new RECRUITER stage sources", () => {
  assert.match(
    todayResultsService,
    /sql<boolean>`\$\{placementRoundResults\.source\} in \('HR','RECRUITER'\)`/,
  );
  assert.match(todayResultsService, /eq\(placementRoundResults\.submittedByUserId,context\.user\.id\)/);
  assert.match(todayResultsService, /recruiterOwnJobPredicate\(context\.user\.id\)/);
  assert.doesNotMatch(todayResultsService, /eq\(placementRoundResults\.source,"HR"\)/);
});

test("DB-072 EXPAND is forward-compatible and non-destructive", () => {
  const { expand } = sections();
  for (const source of [
    "TPO",
    "HR",
    "RECRUITER",
    "PANELIST",
    "DRIVE_DAY",
    "IMPORT",
  ]) {
    assert.match(expand, new RegExp("'" + source + "'"));
  }
  assert.doesNotMatch(
    expand,
    /UPDATE placement_round_results[\s\S]*SET source='RECRUITER'/,
  );
});

test("DB-072 FINALIZE converts HR and enforces final provenance vocabulary", () => {
  const { finalize } = sections();
  assert.match(
    finalize,
    /UPDATE placement_round_results[\s\S]*SET source='RECRUITER'[\s\S]*WHERE source='HR'/,
  );
  const checkStart = finalize.lastIndexOf(
    "ADD CONSTRAINT placement_round_results_source_ck",
  );
  const checkEnd = finalize.indexOf("DO $db072_finalize_postcheck$", checkStart);
  assert.ok(checkStart >= 0 && checkEnd > checkStart);
  const strictCheck = finalize.slice(checkStart, checkEnd);
  for (const source of [
    "TPO",
    "RECRUITER",
    "PANELIST",
    "DRIVE_DAY",
    "IMPORT",
  ]) {
    assert.match(strictCheck, new RegExp("'" + source + "'"));
  }
  assert.doesNotMatch(strictCheck, /'HR'/);
});

test("DB-072 does not recreate submitted_by_type", () => {
  assert.match(candidate, /submitted_by_type is redesigned away/);
  const schemaStart = placements.indexOf("export const placementRoundResults");
  const schemaEnd = placements.indexOf("export const placementOffers", schemaStart);
  const roundResults = placements.slice(schemaStart, schemaEnd);
  assert.match(roundResults, /submittedByUserId: uuid\("submitted_by_user_id"\)/);
  assert.doesNotMatch(roundResults, /submitted_by_type/);
});

const approved =
  process.env.DB08_RECRUITER_CODE_DISPOSABLE ===
    "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA" &&
  Boolean(process.env.TEST_DATABASE_URL) &&
  (!process.env.DATABASE_URL ||
    process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL);

test(
  "DB-072 PostgreSQL expand/finalize sequence preserves compatibility then removes HR",
  { skip: !approved, timeout: 90000 },
  async () => {
    assertSafeDb01TestTarget(process.env);
    const pg = await import("pg");
    const schema =
      "db072_source_" + randomUUID().replaceAll("-", "").slice(0, 18);
    const qSchema = '"' + schema + '"';
    const client = new pg.default.Client({
      connectionString: process.env.TEST_DATABASE_URL,
      application_name: "db072-recruiter-code-witness",
    });
    let created = false;

    const failCheck = async (promise) =>
      assert.rejects(promise, (error) => {
        assert.equal(error.code, "23514", String(error));
        return true;
      });

    try {
      await client.connect();
      await client.query("CREATE SCHEMA " + qSchema);
      created = true;
      await client.query("SET search_path TO " + qSchema + ", pg_catalog");

      await client.query(`
        CREATE TABLE placement_round_results (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          source varchar(16) NOT NULL,
          CONSTRAINT placement_round_results_source_ck
            CHECK (source IN ('TPO','HR','IMPORT'))
        )
      `);
      await client.query(
        "INSERT INTO placement_round_results(source) VALUES ('TPO'),('HR'),('IMPORT')",
      );

      const { expand, finalize } = sections();
      await client.query(expand);

      // EXPAND leaves current data alone and accepts old + new writers.
      const expanded = (
        await client.query(
          "SELECT source,count(*)::int AS count FROM placement_round_results GROUP BY source ORDER BY source",
        )
      ).rows;
      assert.deepEqual(
        expanded,
        [
          { source: "HR", count: 1 },
          { source: "IMPORT", count: 1 },
          { source: "TPO", count: 1 },
        ],
      );
      await client.query(
        "INSERT INTO placement_round_results(source) VALUES " +
        "('HR'),('RECRUITER'),('PANELIST'),('DRIVE_DAY'),('IMPORT')",
      );
      await failCheck(
        client.query(
          "INSERT INTO placement_round_results(source) VALUES ('UNKNOWN')",
        ),
      );

      // FINALIZE must run only after API cutover. The test simulates that gate
      // and executes it in one explicit transaction because LOCK TABLE requires it.
      await client.query("BEGIN");
      try {
        await client.query(finalize);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      }

      const hrCount = Number(
        (
          await client.query(
            "SELECT count(*) FROM placement_round_results WHERE source='HR'",
          )
        ).rows[0].count,
      );
      assert.equal(hrCount, 0);

      const recruiterCount = Number(
        (
          await client.query(
            "SELECT count(*) FROM placement_round_results WHERE source='RECRUITER'",
          )
        ).rows[0].count,
      );
      assert.equal(recruiterCount, 3, "two HR rows should be converted plus one preexisting recruiter row");

      await failCheck(
        client.query(
          "INSERT INTO placement_round_results(source) VALUES ('HR')",
        ),
      );
      for (const source of [
        "TPO",
        "RECRUITER",
        "PANELIST",
        "DRIVE_DAY",
        "IMPORT",
      ]) {
        await client.query(
          "INSERT INTO placement_round_results(source) VALUES ($1)",
          [source],
        );
      }
      await failCheck(
        client.query(
          "INSERT INTO placement_round_results(source) VALUES ('EXCEL')",
        ),
      );
    } finally {
      if (created) {
        try {
          await client.query("SET search_path TO pg_catalog");
          await client.query("DROP SCHEMA " + qSchema + " CASCADE");
        } catch (error) {
          throw new Error("DB-072 disposable witness cleanup failed", {
            cause: error,
          });
        }
      }
      await client.end().catch(() => {});
    }
  },
);
