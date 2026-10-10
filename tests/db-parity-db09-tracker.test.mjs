import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const json = relative =>
  JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));

const source = json(
  "docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json",
);
const tracker = json(
  "docs/planning/database-parity-db09-parallel-tracker.json",
);

test("DB09 source candidates are exhaustively retained without silent field drops", () => {
  assert.equal(source.domain, "DB09_TPO_AND_RECRUITER_OPERATIONS");
  assert.equal(source.tables.length, 31);
  assert.equal(source.counts.tables, 31);
  assert.equal(source.counts.fields, 279);
  assert.equal(tracker.counts.legacyTableCandidates, source.counts.tables);
  assert.equal(tracker.counts.legacyFieldCandidates, source.counts.fields);
  assert.equal(tracker.originalLegacyOracleSha, source.sourceSha);
  assert.equal(tracker.tables.length, source.tables.length);
  const seen = new Set();

  for (const original of source.tables) {
    const row = tracker.tables.find(t => t.legacyTableCandidate === original.table);
    assert.ok(row, `missing source table ${original.table}`);
    assert.equal(row.sourceFieldCount, original.rows.length);
    assert.equal(row.fields.length, original.rows.length);
    assert.equal(row.candidateMappingIsVerified, false);
    for (const f of original.rows) {
      const key = `${original.table}.${f.legacyColumn}`;
      assert.ok(!seen.has(key), `duplicate source field ${key}`);
      seen.add(key);
      const match = row.fields.find(x => x.legacyField === f.legacyColumn);
      assert.ok(match, `untracked source field ${key}`);
      assert.equal(match.sourceSqlType, f.sourceType ?? null);
      assert.equal(match.sourceSqlDefinition, f.sourceDefinition ?? null);
      assert.deepEqual(match.sourceRiskFlags, f.riskFlags ?? []);
      assert.equal(match.disposition, "UNVERIFIED_FIELD_SEMANTICS");
      assert.equal(match.verifiedVnextMapping, null);
      assert.equal(match.validationEvidence, null);
    }
  }
  assert.equal(seen.size, 279);
});

test("DB09 keeps cross-workstream boundaries explicit", () => {
  const byTable = Object.fromEntries(
    tracker.tables.map(t => [t.legacyTableCandidate, t]),
  );
  for (const table of ["student_request", "job_round"]) {
    assert.equal(byTable[table].responsibleWorkstream, "DB08_OWNED");
  }
  for (const table of ["email_suppression", "notification_outbox"]) {
    assert.equal(byTable[table].responsibleWorkstream, "DB10_DEPENDENCY");
  }
  assert.equal(tracker.counts.fieldMappingsVerified, 0);
  assert.equal(tracker.counts.fieldMappingsDbTested, 0);
  assert.equal(tracker.counts.runtimeTestsExecuted, 0);
});

test("DB09 name matches remain candidates, never automatically verified", () => {
  assert.ok(tracker.tables.every(t =>
    Array.isArray(t.candidateTargets) &&
    t.status === "FIELD_SEMANTICS_UNVERIFIED" &&
    t.activeRetiredHistoricalDecision ===
      "PENDING_MIGRATION_CHAIN_AND_PRODUCER_REVIEW",
  ));
  assert.ok(tracker.tables.some(t => t.candidateTargets.length > 0));
  assert.ok(tracker.tables.some(t => t.candidateTargets.length === 0));
});

test("DB09 CRM schema declarations parse uniquely with intact SQL checks", async () => {
  // This source grammar guard catches accidental duplicate or truncated
  // pgTable declarations before a numbered PostgreSQL migration is prepared.
  const typescript = await import("typescript");
  const ts = typescript.default ?? typescript;
  const file = path.join(root, "src/db/schema/tpo-crm.ts");
  const source = fs.readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  assert.deepEqual(
    ast.parseDiagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, "\n")),
    [],
    "TPO CRM staged schema must parse cleanly before migration integration",
  );
  const declarations = [...source.matchAll(
    /export const (placementTpoLeads|placementTpoLeadActivities|placementTpoFollowups)\s*=\s*pgTable\s*\(/g,
  )].map(match => match[1]);
  assert.deepEqual(declarations, [
    "placementTpoLeads", "placementTpoLeadActivities", "placementTpoFollowups",
  ], "CRM must have one lead, activity and follow-up table each");
  assert.ok(source.includes("placement_tpo_leads_phone_digits_ck"));
  assert.ok(source.includes("placement_tpo_leads_invite_hash_ck"));
  assert.match(source, /\^\[0-9\]\{7,20\}\$/);
  assert.match(source, /\^\[a-f0-9\]\{64\}\$/);
});

test("DB09 source-review field classifications never masquerade as semantic parity", () => {
  const rows = source.tables.flatMap(t => t.rows);
  assert.equal(rows.length, 279);
  const review = {
    SOURCE_DDL_REVIEWED_UNVERIFIED: 0,
    SOURCE_TO_VNEXT_DECLARATIONS_COMPARED_UNVERIFIED: 0,
  };
  const matching = {
    MATCHING_NAME_CANDIDATE_ONLY: 0,
    RENAMED_COLUMN_CANDIDATE_ONLY: 0,
    NO_DECLARED_FIELD_EQUIVALENCE_IDENTIFIED: 0,
  };
  for (const row of rows) {
    assert.equal(row.reviewStatus, "UNVERIFIED_FIELD_SEMANTICS");
    assert.equal(row.verifiedMapping, null);
    assert.ok(row.sourceReview, `missing source review ${row.legacyTable}.${row.legacyColumn}`);
    assert.equal(row.sourceReview.legacyOracleSha,
      "21bad59d4dfaf2fa11fdeaf9353327ce105697d5");
    assert.ok(Object.hasOwn(review, row.sourceReview.status),
      `unsupported status ${row.sourceReview.status}`);
    review[row.sourceReview.status]++;
    if (row.sourceReview.fieldMatching) {
      assert.ok(Object.hasOwn(matching, row.sourceReview.fieldMatching));
      matching[row.sourceReview.fieldMatching]++;
    }
  }
  assert.equal(review.SOURCE_DDL_REVIEWED_UNVERIFIED, 14);
  assert.equal(review.SOURCE_TO_VNEXT_DECLARATIONS_COMPARED_UNVERIFIED, 265);
  assert.deepEqual(matching, {
    MATCHING_NAME_CANDIDATE_ONLY: 139,
    RENAMED_COLUMN_CANDIDATE_ONLY: 45,
    NO_DECLARED_FIELD_EQUIVALENCE_IDENTIFIED: 81,
  });
  assert.equal(source.sourceReviewSummary.fieldCandidatesWithReviewNotes, 279);
  assert.equal(source.sourceReviewSummary.semanticallyVerified, 0);
  assert.equal(source.sourceReviewSummary.postgresDbTested, 0);
  assert.equal(source.sourceReviewSummary.approvedRetirements, 0);
});
