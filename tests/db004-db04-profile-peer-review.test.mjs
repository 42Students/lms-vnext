import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const ledger = JSON.parse(read("docs/planning/db01-chat03-db04-profile-peer-review.json"));
const staged = read("src/db/schema/db04-learner-profile-extras.staged.ts");
const sql = read("docs/planning/sql/db04-learner-profile-extras-candidate.sql");

test("DB004 profile peer review closes all 66 cross-domain source rows", () => {
  assert.equal(ledger.rows.length, 66);
  assert.equal(ledger.counts.reviewed, 66);
  assert.equal(ledger.counts.activeTargetGaps, 0);
  assert.equal(ledger.counts.retirementCandidates, 2);
  assert.equal(ledger.counts.resolvedTargetOrExplicitRedesign, 64);
  assert.equal(ledger.counts.runtimeVerified, 0);
});

test("faculty_type remains an authorization-bearing redesign", () => {
  const row = ledger.rows.find((x) => x.legacyField === "faculty.faculty_type");
  assert.ok(row);
  assert.equal(row.disposition, "REDESIGNED_CROSS_DOMAIN_IDENTITY_ROLE_SPLIT");
  assert.match(row.proposedTarget, /membership roles/);
  assert.doesNotMatch(row.proposedTarget, /^faculty_profiles\.employment_type$/);
});

test("only the explicit compatibility address aliases remain retirement candidates", () => {
  const retired = ledger.rows
    .filter((x) => x.disposition === "RETIREMENT_CANDIDATE_COMPAT_ALIAS")
    .map((x) => x.legacyField)
    .sort();
  assert.deepEqual(retired, ["faculty.address", "learner.address"]);
});

test("active learner profile gaps have explicit staged targets", () => {
  const expected = new Map([
    ["learner.identity", /learner_profile_identity_summaries/],
    ["learner.coding_profiles", /codingProfiles/],
    ["learner.resume_url", /purpose=RESUME/],
    ["learner.video_intro_url", /learner_profile_video_intros/],
    ["learner.video_intro_uploaded_at", /uploaded_at/],
    ["learner.current_city", /currentCity/],
    ["learner.current_state", /currentState/],
    ["learner.current_pincode", /currentPincode/],
    ["learner.permanent_city", /permanentCity/],
    ["learner.permanent_state", /permanentState/],
    ["learner.permanent_pincode", /permanentPincode/],
  ]);
  for (const [key, pattern] of expected) {
    const row = ledger.rows.find((x) => x.legacyField === key);
    assert.ok(row, key);
    assert.equal(row.disposition, "PROPOSED_DB04_STAGED_TARGET", key);
    assert.match(row.proposedTarget, pattern, key);
  }
});

test("staged DB04 extras bind secrets/media to same-owner private receipts", () => {
  for (const table of [
    "learner_profile_identity_summaries",
    "learner_profile_private_document_bindings",
    "learner_profile_video_intros",
  ]) {
    assert.match(staged, new RegExp('"' + table + '"'));
    assert.match(sql, new RegExp("CREATE TABLE " + table));
  }
  assert.match(staged, /'AADHAAR','PAN','RESUME'/);
  assert.match(staged, /VIDEO_INTRO/);
  assert.match(sql, /scan_status = 'CLEAN'/);
  assert.match(sql, /revoked_at IS NULL/);
  assert.match(sql, /retention_until IS NULL OR r\.retention_until > now\(\)/);
  assert.match(sql, /db04_video_intro_update_guard/);
});

test("staged contract never stores raw identity values", () => {
  assert.match(staged, /aadhaarLast4/);
  assert.match(staged, /panLast4/);
  assert.doesNotMatch(staged, /aadhaarNumber/);
  assert.doesNotMatch(staged, /panNumber/);
  assert.doesNotMatch(sql, /aadhaar_number/i);
  assert.doesNotMatch(sql, /pan_number/i);
});
