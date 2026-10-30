import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = p => readFileSync(p, "utf8");
const source=JSON.parse(read("docs/planning/db-pass4-columns-db04_profiles_and_verification.json"));
const audit=JSON.parse(read("docs/planning/database-parity-db04-parallel-tracker.json"));
const journal=JSON.parse(read("drizzle/meta/_journal.json"));
const barrel=read("src/db/schema/index.ts");
const schema=read("src/db/schema/profile-verification.ts");
const service=read("src/modules/people/profile-service.ts");
const repository=read("src/modules/people/profile-repository.ts");
const overlay=read("docs/planning/sql/db16-private-object-receipt-overlay-candidate.sql");

test("DB007 103/103 legacy profile source identities retain explicit reviewed status and privacy exceptions",()=>{
  assert.equal(source.counts.tables,7);
  assert.equal(source.counts.fields,103);
  assert.equal(source.sourceReviewSummary.reviewedCandidateFields,103);
  assert.equal(source.sourceReviewSummary.formalSemanticOrRuntimeVerifiedFields,0);
  assert.equal(source.sourceReviewSummary.retirementsApproved,0);
  const keys=source.tables.flatMap(t=>t.rows.map(f=>t.table+"."+f.legacyColumn));
  assert.equal(new Set(keys).size,103);
  const rows=source.tables.flatMap(t=>t.rows);
  assert.equal(rows.filter(f=>f.sourceReview?.status==="ACTIVE_LEGACY_SOURCE_AND_CONSUMER_REVIEWED_NOT_VERIFIED").length,27);
  assert.equal(rows.filter(f=>f.sourceReview?.status==="LEGACY_DDL_TO_STAGED_TARGET_COMPARED_NOT_VERIFIED").length,43);
  assert.equal(rows.filter(f=>f.sourceReview?.status==="HISTORICAL_SCHEMA_REVIEWED_ACTIVE_USAGE_UNPROVEN").length,33);
  assert.equal(audit.sourceCoverage.fields,103);
  assert.equal(audit.sourceCoverage.fieldMappingsVerified,0);
  assert.equal(audit.sourceCoverage.approvedRetirements,0);
  for(const row of rows) {
    assert.equal(row.reviewStatus,"UNVERIFIED_FIELD_SEMANTICS");
    assert.equal(row.verifiedMapping,null);
    assert.ok(row.sourceReview?.status && row.sourceReview?.candidateDisposition && row.sourceReview?.openProbes?.length>0);
  }
});

test("DB007 records actual registered DB04 base while retaining private-document promotion and key-policy gates",()=>{
  for(const tag of ["0063_profile_verification","0231_db04_legacy_profile_education_images","0304_db04_normalized_profile_persistence"])
    assert.ok(journal.entries.some(e=>e.tag===tag),tag);
  assert.match(barrel,/export \* from "\.\/profile-verification"/);
  assert.match(schema,/profilePrivateDocumentReceipts = pgTable/);
  assert.match(schema,/objectGeneration: varchar\("object_generation"/);
  assert.match(schema,/sha256Hex: varchar\("sha256_hex"/);
  assert.match(schema,/scanStatus: varchar\("scan_status"/);
  assert.match(overlay,/scan_attested_by/);
  assert.match(overlay,/retention_until/);
  assert.match(overlay,/revocation_reason/);
  assert.match(service,/PRIVATE_IDENTITY_STORAGE_NOT_READY/);
  assert.match(repository,/PRIVATE_IDENTITY_STORAGE_NOT_READY/);
  assert.ok(audit.remainingBlockers.some(s=>/KMS|vault/i.test(s)));
  assert.ok(audit.remainingBlockers.some(s=>/103 field semantic verification/i.test(s)));
});
