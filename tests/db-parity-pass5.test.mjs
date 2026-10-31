import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const load = f => JSON.parse(fs.readFileSync(f, "utf8"));
const manifest = load("docs/planning/database-parity-pass5-probe-manifest.json");
const journal = load("drizzle/meta/_journal.json");
const latestSnapshotNumber = journal.entries.at(-1)?.tag?.slice(0, 4);
assert.match(latestSnapshotNumber, /^\d{4}$/);
const snapshot = load(`drizzle/meta/${latestSnapshotNumber}_snapshot.json`);
const sql = fs.readFileSync("scripts/sql/vnext-pass5-relational-witness.sql", "utf8");

test("21 Pass 5 witnesses have grounded SQL table and column references", () => {
  assert.equal(manifest.probes.length, 21);
  assert.equal(new Set(manifest.probes.map(p => p.id)).size, 21);
  for (const p of manifest.probes) {
    assert.equal(p.executionEvidence, "NOT_RUN");
    assert.equal(p.expectedViolations, 0);
    assert.match(sql, new RegExp("'check_id','" + p.id + "'"));
    assert.ok(sql.includes("FROM " + p.from + " WHERE " + p.where));
    for (const ref of p.references) {
      const [alias, col] = ref.split(".");
      const table = p.tableAliases[alias];
      assert.ok(snapshot.tables["public." + table]?.columns[col], p.id + ": " + ref);
    }
  }
});

test("witnesses cannot be mistaken for an executed release gate", () => {
  assert.equal(manifest.status, "SOURCE_REVIEW_READY_EXECUTION_NOT_RUN");
  assert.match(sql, /BEGIN TRANSACTION READ ONLY;/);
  assert.match(sql, /Zero counts do NOT prove protection/);
  assert.ok(manifest.probes.every(p => p.executionEvidence === "NOT_RUN"));
});


test("DB15 race probes remain explicit and never masquerade as executed evidence", () => {
  assert.equal(manifest.raceProbes.length, 23);
  assert.equal(new Set(manifest.raceProbes.map(p => p.id)).size, 23);
  const allowed = new Set([
    "SOURCE_CONFIRMED_GAP",
    "SOURCE_FIX_AUTHORED_NEEDS_EXECUTION",
    "SOURCE_PROTECTED_NEEDS_EXECUTION",
    "SOURCE_PROTECTED_DRAFT_UNMIGRATED",
    "PARTIAL_SOURCE_PROTECTION_DISPATCHER_GAP",
    "DRAFT_UNIMPLEMENTED",
    "SOURCE_POLICY_UNDECIDED",
  ]);
  for (const p of manifest.raceProbes) {
    assert.match(p.id, /^P5-R\d{2}$/);
    assert.ok(allowed.has(p.state), p.id + ": unexpected state " + p.state);
    assert.equal(p.executionEvidence, "NOT_RUN");
    assert.ok(
      p.requiredWitness && p.requiredWitness.length > 40,
      p.id + ": witness is underspecified",
    );
    for (const source of p.source.split(";").map(s => s.trim()).filter(Boolean)) {
      assert.ok(
        fs.existsSync(source),
        p.id + ": source path does not exist: " + source,
      );
    }
  }

  const count = state =>
    manifest.raceProbes.filter(p => p.state === state).length;
  assert.equal(count("SOURCE_CONFIRMED_GAP"), 1);
  assert.equal(count("SOURCE_FIX_AUTHORED_NEEDS_EXECUTION"), 3);
  assert.equal(count("SOURCE_PROTECTED_NEEDS_EXECUTION"), 13);
  assert.equal(count("SOURCE_PROTECTED_DRAFT_UNMIGRATED"), 3);
  assert.equal(count("PARTIAL_SOURCE_PROTECTION_DISPATCHER_GAP"), 1);
  assert.equal(count("DRAFT_UNIMPLEMENTED"), 1);
  assert.equal(count("SOURCE_POLICY_UNDECIDED"), 1);
  assert.deepEqual(
    manifest.raceProbes
      .filter(p => p.state === "SOURCE_CONFIRMED_GAP")
      .map(p => p.id),
    ["P5-R21"],
  );
  assert.deepEqual(
    manifest.raceProbes
      .filter(p => p.state === "SOURCE_FIX_AUTHORED_NEEDS_EXECUTION")
      .map(p => p.id),
    ["P5-R01", "P5-R02", "P5-R11"],
  );
  assert.equal(manifest.raceAudit.runtimeVerified, 0);
  assert.deepEqual(
    manifest.raceAudit.blockingGaps,
    ["P5-R01", "P5-R02", "P5-R09", "P5-R10", "P5-R11", "P5-R21", "P5-R22"],
  );
});

test("DB018 witness runner is integrated safely but does not claim database acceptance", () => {
  const runtime = fs.readFileSync(
    "tests/integration/db018-relational-and-boundary-witnesses.test.ts",
    "utf8",
  );
  const config = fs.readFileSync("vitest.db.config.ts", "utf8");
  const verifier = fs.readFileSync("scripts/db-independent-verify.mjs", "utf8");
  assert.match(config, /tests\/integration\/\*\*\/\*\.test\.ts/);
  assert.match(runtime, /TEST_DATABASE_URL/);
  assert.doesNotMatch(runtime, /process\.env\.DATABASE_URL/);
  assert.match(runtime, /DB018_ISOLATED_TEST_DATABASE/);
  assert.match(runtime, /DB03_ISOLATED_TEST_DATABASE/);
  assert.match(verifier, /DB03_ISOLATED_TEST_DATABASE: "1"/);
  assert.match(runtime, /BEGIN READ ONLY/);
  assert.match(runtime, /ROLLBACK/);
  assert.match(runtime, /joinedSamplesNonEmpty/);
  // No completely empty join corpus may be reported as evidence.
  // Academic and placement fixtures are inserted into rollback-only PG
  // transactions; the remaining unseeded joins still remain observational.
  assert.match(runtime, /academicFixtureProbes = new Set/);
  assert.match(runtime, /placementFixtureProbes = new Set/);
  assert.match(runtime, /populatedFixtureProbes = new Set/);
  for (const id of [
    "P5-07", "P5-08", "P5-09", "P5-10", "P5-11",
    "P5-17", "P5-18", "P5-19",
  ]) {
    assert.ok(runtime.includes('"' + id + '"'), id + ": fixture ID missing");
  }
  assert.match(runtime, /insertAcademicWitnessFixture\(client, probe\.id\)/);
  assert.match(runtime, /insertPlacementWitnessFixture\(client, probe\.id\)/);
  assert.match(runtime, /expect\(nonEmpty\)\.toContain\(id\)/);
  assert.match(runtime, /!populatedFixtureProbes\.has\(probe\.id\)/);
  assert.match(runtime, /expect\(n, \`\$\{probe\.id\} has relational mismatch rows\`\)\.toBe\(0\)/);
  assert.match(runtime, /"23503"/);
  assert.match(runtime, /"23505"/);
  assert.match(runtime, /"23514"/);
  assert.match(runtime, /describe\.skipIf\(!enabled\)/);
  assert.equal(manifest.raceAudit.runtimeVerified, 0);
});

test("DB018 runtime witness has current-journal schema grounding", () => {
  for (const probe of manifest.probes) {
    assert.match(probe.from, /JOIN/);
    assert.match(probe.where, /<>/);
    for (const ref of probe.references) {
      const [alias, column] = ref.split(".");
      assert.ok(snapshot.tables[`public.${probe.tableAliases[alias]}`]?.columns[column],
        `${probe.id}: missing current-journal snapshot column ${ref}`);
    }
  }
});

test("DB18 witness index remains honest about authored versus executed coverage", () => {
  const index = load("tests/integration/db18-witness-index.json");
  assert.equal(index.task, "DB-018");
  assert.equal(index.status, "FOCUSED_PG17_WITNESSES_VERIFIED_GLOBAL_GATE_PENDING");
  assert.equal(index.counts.directNegativeAuthored, 9);
  assert.equal(index.counts.existingConcurrencyAuthored, 4);
  assert.equal(index.counts.pendingConcurrencyAuthored, 2);
  assert.equal(index.counts.explicitConcurrencyMissing, 0);
  assert.equal(index.counts.draftUnregisteredExcluded, 3);
  assert.equal(index.counts.knownRedRaceAuthored, 0);
  assert.equal(index.counts.fixAuthoredRaceRuntimePending, 0);
  assert.equal(index.counts.runtimeExecuted, 48);
  assert.equal(index.counts.runtimePassed, 48);
  assert.equal(index.runtimeEvidence.result, "PASS");
  assert.equal(index.runtimeEvidence.runUrl,
    "https://github.com/42Students/lms-vnext/actions/runs/41107736939");
  assert.equal(index.runtimeEvidence.commitSha,
    "654cbc9d69759100ca3fd87a538c6e0cfb3bc2c3");
  assert.equal(index.runtimeEvidence.domainWitnessesPassed, 48);
  assert.equal(index.runtimeEvidence.focusedVitestTestsPassed, 50);
  assert.equal(index.runtimeEvidence.fullSuiteVitestTestsPassed, 92);
  assert.equal(index.runtimeEvidence.directSqlNegatives.passed, 21);
  assert.equal(index.counts.baselineDirectBoundaryAuthored, 12);
  assert.equal(index.runtimeEvidence.relational.empty, 0);
  assert.equal(index.runtimeEvidence.relational.mismatches, 0);
  assert.equal(index.runtimeEvidence.globalDatabasePhaseAccepted, false);

  const directSource = fs.readFileSync(
    "tests/integration/db18-registered-negative-witnesses.test.ts",
    "utf8",
  );
  for (const witness of index.directNegativeWitnesses) {
    assert.equal(witness.execution, "PASS");
    assert.ok(["23514", "23503"].includes(witness.expectedSqlState));
    assert.ok(fs.existsSync(witness.migration), witness.id + ": migration missing");
    assert.ok(directSource.includes(witness.title), witness.id + ": test title missing");
    const migration = fs.readFileSync(witness.migration, "utf8");
    assert.ok(migration.includes(witness.guard), witness.id + ": guard missing");
  }

  for (const witness of index.existingConcurrencyWitnesses) {
    assert.ok(fs.existsSync(witness.file), witness.id + ": test file missing");
    const source = fs.readFileSync(witness.file, "utf8");
    assert.ok(source.includes(witness.title), witness.id + ": concurrency test title missing");
    assert.equal(witness.state, "FOCUSED_PG17_VERIFIED");
  }

  // New race coverage is source-authored only until this exact witness executes
  // against disposable registered PostgreSQL. Historical 48/48 must not inflate.
  assert.deepEqual(index.authoredPendingConcurrencyWitnesses.map(w => w.raceProbe), ["P5-R03", "P5-R11"]);
  for (const witness of index.authoredPendingConcurrencyWitnesses) {
    assert.equal(witness.state, "AUTHORED_AWAITING_REGISTERED_PG17");
    assert.ok(fs.existsSync(witness.file), witness.id + ": pending test file missing");
    assert.ok(fs.readFileSync(witness.file, "utf8").includes(witness.title),
      witness.id + ": pending test title missing");
  }

  assert.deepEqual(index.missingConcurrencyWitnesses, []);
  assert.deepEqual(
    index.knownRedRaceWitnesses.map((w) => w.raceProbe),
    ["P5-R01", "P5-R02"],
  );
  for (const witness of index.knownRedRaceWitnesses) {
    assert.equal(witness.execution, "PASS");
    assert.equal(witness.state, "FIXED_AND_PG17_VERIFIED");
    assert.ok(fs.existsSync(witness.file), witness.id + ": race test file missing");
    const source = fs.readFileSync(witness.file, "utf8");
    assert.ok(source.includes(witness.title), witness.id + ": race title missing");
  }
  assert.ok(index.excludedUntilRegistered.every((w) => /unregistered/.test(w.reason)));
});

test("DB18 stale-check source state tracks authored placement and academics fixes", () => {
  const placementSource = fs.readFileSync(
    "src/modules/placements/application-service.ts",
    "utf8",
  );
  const applyStart = placementSource.indexOf("export async function applyToPlacementJob");
  const applyEnd = placementSource.indexOf("\nexport async function ", applyStart + 1);
  const applyBody = placementSource.slice(applyStart, applyEnd > 0 ? applyEnd : undefined);
  const placementTx = applyBody.indexOf("const created = await getDb().transaction");
  assert.ok(placementTx > 0);
  assert.ok(applyBody.indexOf("await requireLearnerPlacementAccess(context);") < placementTx);
  assert.ok(applyBody.indexOf("await evaluatePlacementEligibility(") < placementTx);
  const placementTxBody = applyBody.slice(placementTx);
  assert.ok(placementTxBody.includes("lockLearnerApplicationGateInputs("));
  assert.ok(placementTxBody.includes("evaluatePlacementEligibility("));
  assert.ok(placementTxBody.includes("liveEligibility"));

  const academicSource = fs.readFileSync(
    "src/modules/academics/enrollment-service.ts",
    "utf8",
  );
  const createStart = academicSource.indexOf("export async function createLearnerProgramEnrollment");
  const createEnd = academicSource.indexOf("export async function transitionLearnerProgramEnrollment", createStart);
  const createBody = academicSource.slice(createStart, createEnd);
  const academicTx = createBody.indexOf("return await db.transaction");
  const cohortPrecheck = createBody.indexOf('cohort.status !== "PLANNED"');
  assert.ok(cohortPrecheck > 0 && cohortPrecheck < academicTx);
  const academicTxBody = createBody.slice(academicTx);
  assert.ok(academicTxBody.includes(".from(cohorts)"));
  assert.ok(academicTxBody.includes("cohorts.status"));
  assert.ok(academicTxBody.includes('.for("share")'));
  assert.ok(academicTxBody.includes('liveCohort.status !== "PLANNED"'));
  assert.ok(academicTxBody.includes('liveCohort.status !== "ACTIVE"'));

  const index = load("tests/integration/db18-witness-index.json");
  assert.deepEqual(
    index.knownRedRaceWitnesses.map((w) => w.raceProbe),
    ["P5-R01", "P5-R02"],
  );
  assert.equal(
    index.knownRedRaceWitnesses.find((w) => w.raceProbe === "P5-R01")?.state,
    "FIXED_AND_PG17_VERIFIED",
  );
  assert.equal(
    index.knownRedRaceWitnesses.find((w) => w.raceProbe === "P5-R02")?.state,
    "FIXED_AND_PG17_VERIFIED",
  );
  assert.deepEqual(index.missingConcurrencyWitnesses, []);
});


test("DB18 canonical denominator stays source-grounded", () => {
  const index = load("tests/integration/db18-witness-index.json");
  assert.equal(index.counts.observationalReadOnlyAuthored, 21);
  assert.equal(index.counts.directNegativeTotalAuthored, 21);
  assert.equal(index.counts.baselineDirectBoundaryAuthored, index.baselineDirectBoundaryWitnesses.length);
  assert.equal(index.counts.directNegativeTotalAuthored, index.counts.directNegativeAuthored + index.counts.baselineDirectBoundaryAuthored);
  assert.equal(index.counts.positiveConcurrencyAuthored, 4);
  // Source fixes exist for both races, but no PostgreSQL race acceptance ran.
  // Derive the denominator from the canonical witness entries to catch drift.
  const unresolvedRaces = index.knownRedRaceWitnesses.filter(
    (w) => w.state === "EXPECTED_FAIL_UNTIL_FIXED",
  );
  const verifiedFixed = index.knownRedRaceWitnesses.filter(
    (w) => w.state === "FIXED_AND_PG17_VERIFIED",
  );
  assert.equal(index.counts.knownRedRaceAuthored, unresolvedRaces.length);
  assert.equal(index.counts.fixAuthoredRaceRuntimePending, 0);
  assert.equal(index.counts.fixedRaceRuntimeVerified, verifiedFixed.length);
  assert.equal(unresolvedRaces.length, 0);
  assert.deepEqual(verifiedFixed.map((w) => w.raceProbe), ["P5-R01", "P5-R02"]);
  assert.ok(verifiedFixed.every((w) => w.execution === "PASS"));
  assert.equal(index.counts.explicitConcurrencyMissing, 0);
  assert.equal(index.counts.runtimeExecuted, 48);
  assert.equal(index.counts.runtimePassed, 48);

  assert.equal(index.observationalWitnesses.count, manifest.probes.length);
  assert.ok(fs.existsSync(index.observationalWitnesses.executableFile));

  for (const witness of index.baselineDirectBoundaryWitnesses) {
    assert.equal(witness.execution, "PASS");
    assert.ok(["23503", "23505", "23514"].includes(witness.expectedSqlState));
    assert.ok(fs.existsSync(witness.file));
    const source = fs.readFileSync(witness.file, "utf8");
    assert.ok(source.includes(witness.title), witness.id + ": baseline title missing");
  }

  const coverage = fs.readFileSync(
    "docs/planning/db18-negative-witness-coverage.md",
    "utf8",
  );
  assert.match(coverage, /Read-only relational mismatch probes \| 21 \| 21/);
  assert.match(coverage, /Direct negative SQL boundary tests \| 21 \| 21/);
  assert.match(coverage, /Positive concurrency witnesses \| 4 \| 4/);
  assert.match(coverage, /Known-defect red concurrency witnesses \| 0 \| 0/);
  assert.match(coverage, /Fix-authored race regression verified \| 2 \| 2/);
  assert.match(coverage, /must \*\*not\*\* become `DONE_VERIFIED`/);
});


test("DB18 mutation witnesses are fail-closed to an isolated database", () => {
  const directFiles = [
    "tests/integration/db18-registered-negative-witnesses.test.ts",
    "tests/integration/db18-concurrency-witnesses.test.ts",
  ];
  const serviceFiles = [
    "tests/integration/db18-known-race-gaps.test.ts",
    "tests/integration/db18-placement-race-gap.test.ts",
  ];
  for (const file of [...directFiles, ...serviceFiles]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /process\.env\.TEST_DATABASE_URL/);
    assert.match(source, /DB018_ISOLATED_TEST_DATABASE/);
    assert.match(source, /DB03_ISOLATED_TEST_DATABASE/);
    assert.doesNotMatch(
      source,
      /TEST_DATABASE_URL\s*\?\?\s*process\.env\.DATABASE_URL/,
    );
  }
  for (const file of serviceFiles) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(
      source,
      /process\.env\.DATABASE_URL\s*===\s*databaseUrl/,
    );
  }
});
