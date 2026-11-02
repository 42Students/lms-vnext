// API-03-P02: Learner profiles, identity and private evidence — integration gate
// Source-only: verifies crosswalk completeness, all vNextPath files exist,
// and key route files exist for the profile/people/teaching-assignment domain.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api03.json");
const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));

function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

describe("API-03-P02 integration gate", () => {
  it("crosswalk JSON is present and milestone is API-03", () => {
    assert.ok(fs.existsSync(crosswalkPath));
    assert.equal(crosswalk.milestoneId, "API-03");
  });

  it("frozen legacy SHA is pinned correctly", () => {
    assert.equal(crosswalk.frozenLegacySha, "21bad59d4dfaf2fa11fdeaf9353327ce105697d5");
  });

  it("summary totals are consistent", () => {
    const { total, mapped, redesigned, retired, missing } = crosswalk.summary;
    assert.equal(mapped + redesigned + retired + missing, total);
    assert.ok(total >= 130);
  });

  it("all REDESIGNED endpoints have notes", () => {
    const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
    for (const ep of redesigned) {
      assert.ok(ep.notes && ep.notes.length > 5, `REDESIGNED endpoint missing notes: ${ep.legacyPath}`);
    }
  });

  it("all REDESIGNED vNextPath files exist on disk", () => {
    const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
    const missing = redesigned.filter(e => !fileExists(e.vNextPath));
    assert.equal(
      missing.length, 0,
      `${missing.length} REDESIGNED vNextPath files missing:\n${missing.map(e => e.vNextPath).join("\n")}`
    );
  });

  it("MISSING gaps documented in missingGapNotes (>=14)", () => {
    assert.ok(
      crosswalk.missingGapNotes.length >= 14,
      `expected >=14 missingGapNotes, got ${crosswalk.missingGapNotes.length}`
    );
  });

  it("at least 6 RETIRED endpoints (OTP/login flows)", () => {
    const retired = crosswalk.endpoints.filter(e => e.disposition === "RETIRED");
    assert.ok(retired.length >= 6, `expected >=6 RETIRED, got ${retired.length}`);
  });

  it("profile/me/sections route exists (central learner profile hub)", () => {
    assert.ok(
      fileExists("src/app/api/profile/me/sections/route.ts"),
      "src/app/api/profile/me/sections/route.ts must exist"
    );
  });

  it("profile/me route exists", () => {
    assert.ok(fileExists("src/app/api/profile/me/route.ts"));
  });

  it("profile/me/contacts route exists", () => {
    assert.ok(fileExists("src/app/api/profile/me/contacts/route.ts"));
  });

  it("profile/me/education-config route exists", () => {
    assert.ok(fileExists("src/app/api/profile/me/education-config/route.ts"));
  });

  it("profile/learner-gallery route exists", () => {
    assert.ok(fileExists("src/app/api/profile/learner-gallery/route.ts"));
  });

  it("people/route.ts exists (unified people listing)", () => {
    assert.ok(fileExists("src/app/api/people/route.ts"));
  });

  it("people/onboard/route.ts exists (learner/faculty registration)", () => {
    assert.ok(fileExists("src/app/api/people/onboard/route.ts"));
  });

  it("people/[membershipId]/route.ts exists", () => {
    assert.ok(fileExists("src/app/api/people/[membershipId]/route.ts"));
  });

  it("people/[membershipId]/faculty-profile/route.ts exists", () => {
    assert.ok(fileExists("src/app/api/people/[membershipId]/faculty-profile/route.ts"));
  });

  it("people/[membershipId]/lifecycle/route.ts exists", () => {
    assert.ok(fileExists("src/app/api/people/[membershipId]/lifecycle/route.ts"));
  });

  it("faculty-self-document/route.ts exists (faculty profile edits)", () => {
    assert.ok(fileExists("src/app/api/people/faculty-self-document/route.ts"));
  });

  it("faculty-self-document/identity/route.ts exists", () => {
    assert.ok(fileExists("src/app/api/people/faculty-self-document/identity/route.ts"));
  });

  it("faculty-self-document/attachments/route.ts exists (certifications)", () => {
    assert.ok(fileExists("src/app/api/people/faculty-self-document/attachments/route.ts"));
  });

  it("courses/teaching-assignments/route.ts exists", () => {
    assert.ok(fileExists("src/app/api/courses/teaching-assignments/route.ts"));
  });

  it("college/teaching-assignments/bulk/route.ts exists", () => {
    assert.ok(fileExists("src/app/api/college/teaching-assignments/bulk/route.ts"));
  });

  it("academics/faculty-assignments/route.ts exists", () => {
    assert.ok(fileExists("src/app/api/academics/faculty-assignments/route.ts"));
  });

  it("people/student-import/route.ts exists (bulk learner import)", () => {
    assert.ok(fileExists("src/app/api/people/student-import/route.ts"));
  });

  it("admin/faculty/bulk-import/route.ts exists (bulk faculty import)", () => {
    assert.ok(fileExists("src/app/api/admin/faculty/bulk-import/route.ts"));
  });

  it("admin/hr/[userId]/route.ts exists (HR self-profile)", () => {
    assert.ok(fileExists("src/app/api/admin/hr/[userId]/route.ts"));
  });
});
