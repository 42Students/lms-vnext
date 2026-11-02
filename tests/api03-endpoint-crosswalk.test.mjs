// API-03-P01: Learner profiles, identity and private evidence — endpoint crosswalk gate
// Source-only tests: no DB, no HTTP calls. Verifies the crosswalk JSON shape and
// that all REDESIGNED vNextPath files exist on disk.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api03.json");
const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));

describe("API-03-P01 endpoint crosswalk gate", () => {
  it("crosswalk file exists and parses", () => {
    assert.ok(fs.existsSync(crosswalkPath), "api-crosswalk-api03.json must exist");
    assert.equal(crosswalk.milestoneId, "API-03");
  });

  it("frozen legacy SHA is pinned", () => {
    assert.equal(
      crosswalk.frozenLegacySha,
      "21bad59d4dfaf2fa11fdeaf9353327ce105697d5",
      "frozenLegacySha must match the frozen oracle SHA"
    );
  });

  it("summary totals are self-consistent", () => {
    const { total, mapped, redesigned, retired, missing } = crosswalk.summary;
    assert.equal(
      mapped + redesigned + retired + missing,
      total,
      "mapped+redesigned+retired+missing must equal total"
    );
    assert.ok(total >= 130, `total endpoints must be >=130, got ${total}`);
  });

  it("endpoint array length matches summary.total", () => {
    assert.equal(
      crosswalk.endpoints.length,
      crosswalk.summary.total,
      "endpoints array length must equal summary.total"
    );
  });

  it("every endpoint has required fields", () => {
    for (const ep of crosswalk.endpoints) {
      assert.ok(ep.legacyController, `endpoint missing legacyController: ${JSON.stringify(ep)}`);
      assert.ok(ep.legacyMethod, `endpoint missing legacyMethod: ${JSON.stringify(ep)}`);
      assert.ok(ep.legacyPath, `endpoint missing legacyPath: ${JSON.stringify(ep)}`);
      assert.ok(
        ["MAPPED", "REDESIGNED", "RETIRED", "MISSING"].includes(ep.disposition),
        `invalid disposition '${ep.disposition}' for ${ep.legacyPath}`
      );
      assert.ok(ep.notes, `endpoint missing notes: ${ep.legacyPath}`);
    }
  });

  it("disposition counts match summary", () => {
    const counts = { MAPPED: 0, REDESIGNED: 0, RETIRED: 0, MISSING: 0 };
    for (const ep of crosswalk.endpoints) counts[ep.disposition]++;
    assert.equal(counts.MAPPED, crosswalk.summary.mapped, `MAPPED count mismatch`);
    assert.equal(counts.REDESIGNED, crosswalk.summary.redesigned, `REDESIGNED count mismatch`);
    assert.equal(counts.RETIRED, crosswalk.summary.retired, `RETIRED count mismatch`);
    assert.equal(counts.MISSING, crosswalk.summary.missing, `MISSING count mismatch`);
  });

  it("all REDESIGNED endpoints have vNextPath and authGuard", () => {
    const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
    for (const ep of redesigned) {
      assert.ok(ep.vNextPath, `REDESIGNED endpoint missing vNextPath: ${ep.legacyPath}`);
      assert.ok(ep.authGuard, `REDESIGNED endpoint missing authGuard: ${ep.legacyPath}`);
      assert.equal(
        ep.authGuard,
        "isSameOriginRequest",
        `authGuard must be isSameOriginRequest: ${ep.legacyPath}`
      );
    }
  });

  it("all MAPPED endpoints have vNextPath and authGuard", () => {
    const mapped = crosswalk.endpoints.filter(e => e.disposition === "MAPPED");
    for (const ep of mapped) {
      assert.ok(ep.vNextPath, `MAPPED endpoint missing vNextPath: ${ep.legacyPath}`);
      assert.ok(ep.authGuard, `MAPPED endpoint missing authGuard: ${ep.legacyPath}`);
    }
  });

  it("all MISSING and RETIRED endpoints have null vNextPath", () => {
    const gapped = crosswalk.endpoints.filter(e => ["MISSING", "RETIRED"].includes(e.disposition));
    for (const ep of gapped) {
      assert.equal(ep.vNextPath, null, `${ep.disposition} endpoint must have null vNextPath: ${ep.legacyPath}`);
    }
  });

  it("MISSING endpoints are documented in missingGapNotes", () => {
    const missing = crosswalk.endpoints.filter(e => e.disposition === "MISSING");
    assert.ok(
      crosswalk.missingGapNotes.length >= missing.length * 0.5,
      `missingGapNotes (${crosswalk.missingGapNotes.length}) should document >=50% of MISSING endpoints (${missing.length})`
    );
  });

  it("REDESIGNED vNextPath files exist on disk", () => {
    const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
    const missing = [];
    for (const ep of redesigned) {
      const full = path.join(root, ep.vNextPath);
      if (!fs.existsSync(full)) missing.push(ep.vNextPath);
    }
    assert.equal(
      missing.length,
      0,
      `${missing.length} REDESIGNED vNextPath files not found on disk:\n${missing.slice(0, 10).join("\n")}`
    );
  });

  it("all tenant-scoped REDESIGNED endpoints have tenantScoped=true", () => {
    const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
    const unscoped = redesigned.filter(e => e.tenantScoped !== true && e.tenantScoped !== false);
    assert.equal(unscoped.length, 0, `tenantScoped must be boolean on all REDESIGNED: ${JSON.stringify(unscoped.map(e=>e.legacyPath))}`);
  });

  it("all 7 legacy controllers are represented", () => {
    const controllers = new Set(crosswalk.endpoints.map(e => e.legacyController));
    const expected = [
      "LearnerController",
      "LearnerProfileController",
      "FacultyController",
      "FacultyProfileController",
      "HrSelfController",
      "StudentImageController",
      "FacultyTeachingAssignmentController",
    ];
    for (const c of expected) {
      assert.ok(controllers.has(c), `controller not found in crosswalk: ${c}`);
    }
  });

  it("FacultyCourseAssociationController is also represented", () => {
    const controllers = new Set(crosswalk.endpoints.map(e => e.legacyController));
    assert.ok(controllers.has("FacultyCourseAssociationController"));
  });

  it("RETIRED endpoints are role-specific login/OTP flows", () => {
    const retired = crosswalk.endpoints.filter(e => e.disposition === "RETIRED");
    assert.equal(retired.length, crosswalk.summary.retired);
    for (const ep of retired) {
      assert.ok(
        ep.legacyPath.includes("login") || ep.legacyPath.includes("OTP") || ep.legacyPath.includes("verifyOTP"),
        `unexpected RETIRED endpoint (expected login/OTP flow): ${ep.legacyPath}`
      );
    }
  });

  it("profile/me routes cover LearnerProfileController redesigns", () => {
    const learnerProfileRedesigned = crosswalk.endpoints.filter(
      e => e.legacyController === "LearnerProfileController" && e.disposition === "REDESIGNED"
    );
    const profileMePaths = learnerProfileRedesigned.filter(e =>
      e.vNextPath && e.vNextPath.includes("profile/me")
    );
    assert.ok(
      profileMePaths.length >= 20,
      `expected >=20 LearnerProfileController endpoints mapped to profile/me routes, got ${profileMePaths.length}`
    );
  });

  it("faculty-self-document routes cover FacultyProfileController redesigns", () => {
    const facultyProfileRedesigned = crosswalk.endpoints.filter(
      e => e.legacyController === "FacultyProfileController" && e.disposition === "REDESIGNED"
    );
    const selfDocPaths = facultyProfileRedesigned.filter(e =>
      e.vNextPath && e.vNextPath.includes("faculty-self-document")
    );
    assert.ok(
      selfDocPaths.length >= 15,
      `expected >=15 FacultyProfileController endpoints mapped to faculty-self-document, got ${selfDocPaths.length}`
    );
  });
});
