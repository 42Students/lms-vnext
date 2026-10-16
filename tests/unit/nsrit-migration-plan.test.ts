import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../../scripts/migrate/nsrit/common";
import { snapshotDigest, toNdjson, type Manifest, type ManifestTable } from "../../scripts/migrate/nsrit/export-lib";
import { buildPlan } from "../../scripts/migrate/nsrit/plan";
import {
  buildReconciliation,
  rejectionReportMarkdown,
  reviewListCsv,
  reviewListMarkdown,
} from "../../scripts/migrate/nsrit/reports";
import {
  REQUIRED_TABLES,
  SnapshotIntegrityError,
  readSnapshot,
  type Snapshot,
} from "../../scripts/migrate/nsrit/snapshot";

type Row = Record<string, unknown>;

// All values below are synthetic. Phones use the reserved 98765 43xxx style
// range and e-mails use reserved example domains or fake college domains.
function fixtureTables(): Record<string, Row[]> {
  const tables: Record<string, Row[]> = Object.fromEntries(REQUIRED_TABLES.map((t) => [t, []]));
  tables.organization = [{ id: 6, name: "Synthetic Org", created_at: "2026-05-01 10:00:00.000000", updated_at: "2026-05-01 10:00:00.000000", is_deleted: 0 }];
  tables.college = [{ id: 6, name: "Synthetic College", unique_id: "synth42", org_id: 6, city: "Synth City", created_at: "2026-05-01 10:00:00.000000", updated_at: "2026-05-01 10:00:00.000000", is_deleted: 0 }];
  tables.department = [
    { id: 1, name: "Computing", college_id: 6, is_deleted: 0, created_at: "2026-05-02 10:00:00" },
    { id: 2, name: "computing", college_id: 6, is_deleted: 0, created_at: "2026-05-03 10:00:00" },
    { id: 3, name: "E2E Dept 12345", college_id: 6, is_deleted: 0 },
    { id: 4, name: "Retired", college_id: 6, is_deleted: 1 },
    { id: 5, name: "Mathematics", college_id: 6, is_deleted: 0 },
  ];
  tables.new_program = [
    { id: 10, dept_id: 1, name: "BTech", duration_years: 4, is_deleted: 0 },
    { id: 11, dept_id: 1, name: "btech", duration_years: 4, is_deleted: 0 },
    { id: 12, dept_id: 3, name: "Orphan", duration_years: 2, is_deleted: 0 },
    { id: 13, dept_id: 1, name: "Short", duration_years: 1, is_deleted: 0 },
  ];
  tables.semester = [
    { id: 20, program_id: 10, semester_number: 1, name: "Semester 1", is_active: 1, total_credits: 20 },
    { id: 21, program_id: 10, semester_number: 1, name: "Semester 1 again", is_active: 1, total_credits: 20 },
    { id: 22, program_id: 13, semester_number: 5, name: "Semester 5", is_active: null, total_credits: 7.5 },
    { id: 23, program_id: 12, semester_number: 1, name: "Orphaned", is_active: 1, total_credits: 1 },
  ];
  tables.batch = [
    { id: 30, program_id: 10, batch_name: "2026 Batch", academic_year: "2026-27", current_semester: 3, status: "ACTIVE" },
    { id: 31, program_id: 10, batch_name: "Bad Year", academic_year: "soon", current_semester: 1, status: "ACTIVE" },
    { id: 32, program_id: 13, batch_name: "Past Batch", academic_year: "2024-25", current_semester: 1, status: "COMPLETED" },
  ];
  tables.class = [
    { id: 40, program_id: 10, batch_id: 30, name: "Sec A", class_type: "SECTION", upper_limit: 60, lower_limit: 10, description: "demo cohort text is fine" },
    { id: 41, program_id: 10, batch_id: 30, name: "Sec B", class_type: "SECTION", upper_limit: 0, lower_limit: 5 },
    { id: 42, program_id: 10, batch_id: 30, name: "[Elective] Java Professional Elective 1", class_type: "GROUP_BACKED" },
    { id: 43, program_id: 10, batch_id: 30, name: "[Elective] X SMOKE PE", class_type: "GROUP_BACKED" },
    { id: 44, program_id: 10, batch_id: 99, name: "Lost", class_type: "SECTION" },
    { id: 45, program_id: 10, batch_id: 30, name: "sec a", class_type: "SECTION" },
  ];
  tables.lecture_hall = [
    { id: 50, college_id: 6, dept_id: 1, name: "Hall One", capacity: 80, room_type: 1 },
    { id: 51, college_id: 6, dept_id: 0, name: "E2E Hall 99", capacity: 50, room_type: 0 },
    { id: 52, college_id: 6, dept_id: 0, name: "Zero Cap", capacity: 0, room_type: 0 },
    { id: 53, college_id: 6, dept_id: 0, name: "Odd Type", capacity: 10, room_type: 77 },
    { id: 54, college_id: 6, dept_id: 0, name: "hall one", capacity: 10, room_type: 2 },
  ];
  const learner = (id: number, extra: Row): Row => ({
    id,
    college_id: 6,
    class_id: 40,
    first_name: `Learner${id}`,
    last_name: "Synthetic",
    contact_mobile: `98765430${String(id).padStart(2, "0")}`,
    contact_mail: `learner${id}@college.example.edu`,
    roll_number: `R${id}`,
    created_at: `2026-06-0${(id % 9) + 1} 09:00:00`,
    is_deleted: 0,
    ...extra,
  });
  tables.learner = [
    learner(1, {}),
    learner(2, { contact_mobile: "9876543001" }), // shares learner 1's phone? (set below)
    learner(3, { class_id: 42 }), // class deferred -> no enrollment
    learner(4, { contact_mail: "someone@testing.com" }),
    learner(5, { first_name: "Jane", last_name: "Doe" }),
    learner(6, { suspended_at: "2026-07-01 10:00:00", suspension_reason: "Synthetic reason" }),
    learner(7, { contact_mobile: "12345", contact_mail: null }),
    learner(8, { contact_mobile: "98765 43999", contact_mail: "LEARNER8@College.Example.Edu ", class_id: 43, created_at: "2026-06-01 08:00:00" }),
    learner(9, { contact_mobile: null, contact_mail: "learner9@college.example.edu", created_at: "2026-06-20 08:00:00" }),
  ];
  tables.learner[1].contact_mobile = tables.learner[0].contact_mobile; // shared phone
  tables.learner[8].contact_mail = "learner8@college.example.edu"; // shared e-mail (case-insensitive) with learner 8, which is older
  tables.qualification = [{ id: 1, learner_id: 1, education_type: "UG", program: "BTech", institution_name: "Synth Univ", grading_type: "CGPA", grade: "8.2", max_grade: "10", is_deleted: 0 }];
  tables.faculty = [
    { id: 1, college_id: 6, organization_id: 6, first_name: "Prof", last_name: "Synthetic", contact_mobile: "9876543500", contact_mail: "prof@college.example.edu", faculty_type: 4, dept_id: 1, created_at: "2026-05-02 09:00:00" },
    { id: 2, college_id: 6, organization_id: 6, first_name: "Mentor", last_name: "Synthetic", contact_mobile: "9876543501", contact_mail: null, faculty_type: 13, dept_id: 3, created_at: "2026-05-03 09:00:00" },
    { id: 3, college_id: 6, organization_id: null, first_name: "E2E", last_name: "Faculty", contact_mobile: "9876543502", faculty_type: 0, created_at: "2026-05-04 09:00:00" },
    // same phone as learner 3, created EARLIER than the learner -> faculty wins, learner blocked
    { id: 4, college_id: 6, organization_id: 6, first_name: "Tpo", last_name: "Synthetic", contact_mobile: tables.learner[2].contact_mobile, contact_mail: "tpo@college.example.edu", faculty_type: 14, dept_id: 1, created_at: "2026-01-01 09:00:00" },
    { id: 5, college_id: 6, organization_id: 6, first_name: "Nulltype", last_name: "Synthetic", contact_mobile: "9876543503", faculty_type: null, created_at: "2026-05-05 09:00:00" },
  ];
  tables.recruiter = [
    { id: 1, first_name: "Real", last_name: "Recruiter", contact_mobile: "9876543600", contact_mail: "hr@bigcorp.example.com", company_id: 1, industry_company_id: null, is_deleted: 0 },
    { id: 2, first_name: "Test", last_name: "Recruiter", contact_mobile: "9876543601", contact_mail: "qa.hr@bigcorp.example.com", company_id: 1, is_deleted: 0 },
  ];
  tables.company = [{ id: 1, name: "Big Corp", is_deleted: 0 }];
  return tables;
}

function toSnapshot(tables: Record<string, Row[]>): Snapshot {
  const manifestTables: Record<string, ManifestTable> = {};
  for (const [name, rows] of Object.entries(tables)) {
    manifestTables[name] = {
      file: `${name}.ndjson`,
      rows: rows.length,
      sha256: sha256Hex(toNdjson(rows)),
      scope: "synthetic",
      columns: [],
      deniedColumns: [],
      scrubbedJsonKeys: 0,
    };
  }
  const manifest: Manifest = {
    format: "nsrit-snapshot-1",
    exporter: "test",
    legacyDatabase: "synthetic",
    exportedAt: "2026-10-16T00:00:00Z",
    college: { legacyCollegeId: 6, legacyOrgId: 6 },
    snapshotSha256: snapshotDigest(manifestTables),
    tables: manifestTables,
  };
  return { dir: "memory", manifest, tables };
}

const TODAY = new Date("2026-10-16T00:00:00Z");

describe("buildPlan on a synthetic snapshot", () => {
  const snapshot = toSnapshot(fixtureTables());
  const plan = buildPlan(snapshot, { today: TODAY });
  const reasons = (entity: string) =>
    plan.rejections.filter((r) => r.entity === entity).map((r) => `${r.legacyId}:${r.reason}`).sort();

  it("keeps the college anchored to deterministic ids", () => {
    expect(plan.college.data.code).toBe("synth42");
    expect(plan.college.data.organizationId).toBe(plan.organization.newId);
    const again = buildPlan(snapshot, { today: TODAY });
    expect(again.college.newId).toBe(plan.college.newId);
    expect(again.people.map((p) => p.newId)).toEqual(plan.people.map((p) => p.newId));
    expect(again.people.map((p) => p.hash)).toEqual(plan.people.map((p) => p.hash));
  });

  it("rejects junk, soft-deleted and duplicate departments and programs", () => {
    expect(plan.departments.map((d) => d.legacyId)).toEqual(["1", "5"]);
    expect(reasons("department")).toEqual(["2:DUPLICATE_NAME", "3:NAME_E2E", "4:SOFT_DELETED"]);
    expect(plan.programs.map((p) => p.legacyId)).toEqual(["10", "13"]);
    expect(reasons("program")).toEqual(["11:DUPLICATE_NAME", "12:PARENT_REJECTED"]);
  });

  it("raises program duration to cover legacy terms and rounds half up", () => {
    const short = plan.programs.find((p) => p.legacyId === "13")!;
    expect(short.data.durationTerms).toBe(5); // 1 year -> 2 terms, but term 5 exists
    expect(plan.notes.programDurationRaisedForTerms).toBe(1);
    const term5 = plan.terms.find((t) => t.legacyId === "22")!;
    expect(term5.data.totalCredits).toBe(8); // 7.5 -> 8
    expect(term5.data.isActive).toBe(true); // null -> default active
    expect(plan.notes.roundedToInteger).toBeGreaterThanOrEqual(1);
    expect(reasons("semester")).toEqual(["21:DUPLICATE_NAME", "23:PARENT_REJECTED"]);
  });

  it("derives academic periods and cohorts from batches", () => {
    expect(plan.periods.map((p) => p.data.code).sort()).toEqual(["AY2024-25", "AY2026-27"]);
    expect(plan.cohorts.map((c) => c.legacyId)).toEqual(["30", "32"]);
    expect(reasons("batch")).toEqual(["31:INVALID_VALUE"]);
    expect(plan.notes.cohortsLegacySemesterAboveOne).toBe(1);
    const cohort = plan.cohorts.find((c) => c.legacyId === "30")!;
    expect(cohort.data.status).toBe("ACTIVE");
    expect(plan.cohorts.find((c) => c.legacyId === "32")!.data.status).toBe("COMPLETED");
  });

  it("maps sections, defers elective-backed classes and rejects orphans", () => {
    expect(plan.sections.map((s) => s.legacyId)).toEqual(["40", "41"]);
    expect(plan.deferred.filter((d) => d.entity === "class").map((d) => d.legacyId)).toEqual(["42"]);
    expect(reasons("class")).toEqual(["43:NAME_TESTWORD", "44:PARENT_REJECTED", "45:DUPLICATE_NAME"]);
    const a = plan.sections.find((s) => s.legacyId === "40")!;
    expect(a.data).toMatchObject({ capacity: 60, minSize: 10, description: "demo cohort text is fine" });
    const b = plan.sections.find((s) => s.legacyId === "41")!;
    expect(b.data.capacity).toBeNull(); // legacy 0 means unlimited
    expect(b.data.minSize).toBe(5);
  });

  it("filters lecture halls", () => {
    expect(plan.halls.map((h) => h.legacyId)).toEqual(["50"]);
    expect(plan.halls[0].data).toMatchObject({ roomType: "LECTURE_HALL", capacity: 80 });
    expect(reasons("lecture_hall")).toEqual(["51:NAME_E2E", "52:INVALID_VALUE", "53:UNKNOWN_ENUM", "54:DUPLICATE_NAME"]);
  });

  it("loads people with roles, suspension and enrollment, and rejects test accounts", () => {
    expect(reasons("learner")).toContain("4:EMAIL_DOMAIN");
    expect(reasons("learner")).toContain("5:NAME_PLACEHOLDER");
    expect(reasons("learner")).toContain("7:INVALID_PHONE_NO_EMAIL");
    expect(reasons("faculty")).toEqual(["3:NAME_E2E"]);
    const byKey = (type: string, id: string) => plan.people.find((p) => p.legacyType === type && p.legacyId === id);
    const suspended = byKey("learner", "6")!;
    expect(suspended.data.membershipStatus).toBe("SUSPENDED");
    expect(suspended.data.suspensionReason).toBe("Synthetic reason");
    expect(suspended.data.suspendedAt).toBe("2026-07-01T04:30:00.000Z"); // IST -> UTC
    const admin = byKey("faculty", "1")!;
    expect(admin.data.roles).toEqual(["FACULTY", "COLLEGE_ADMIN"]);
    expect(admin.data.faculty?.primaryDepartmentId).toBe(plan.departments[0].newId);
    expect(byKey("faculty", "2")!.data.roles).toEqual(["FACULTY", "MENTOR"]);
    expect(byKey("faculty", "2")!.data.faculty?.primaryDepartmentId).toBeNull(); // dept 3 rejected
    expect(byKey("faculty", "5")!.data.roles).toEqual(["FACULTY"]);
    expect(plan.notes.facultyTypeUnknown).toBe(1);
    expect(plan.notes.facultyDepartmentUnmapped).toBe(1);
    const enrolled = byKey("learner", "1")!;
    expect(enrolled.data.enrollment?.sectionId).toBe(plan.sections[0].newId);
    expect(enrolled.data.learner?.rollNumber).toBe("R1");
    expect(byKey("learner", "8")!.data.enrollment).toBeNull(); // its class was rejected as test data
    expect(plan.notes.learnersWithoutEnrollment).toBe(1);
    expect(enrolled.data.phoneE164).toMatch(/^\+91\d{10}$/);
    expect(byKey("learner", "8")!.data.email).toBe("learner8@college.example.edu");
    expect(byKey("learner", "9")).toBeUndefined(); // blocked: e-mail already held by learner 8
  });

  it("blocks later accounts that share a phone or e-mail with a loaded one and never merges", () => {
    const blocked = plan.blocked.map((b) => `${b.entity}#${b.legacyId}:${b.reason}`).sort();
    expect(blocked).toEqual(["learner#2:BLOCKED_DUPLICATE", "learner#3:BLOCKED_DUPLICATE", "learner#9:BLOCKED_DUPLICATE"]);
    // learner 3 shares a phone with the earlier faculty account, which is loaded
    expect(plan.people.some((p) => p.legacyType === "faculty" && p.legacyId === "4")).toBe(true);
    expect(plan.people.some((p) => p.legacyType === "learner" && p.legacyId === "3")).toBe(false);
    const phones = plan.people.map((p) => p.data.phoneE164).filter(Boolean);
    expect(new Set(phones).size).toBe(phones.length);
    const emails = plan.people.map((p) => p.data.email).filter(Boolean);
    expect(new Set(emails).size).toBe(emails.length);
    expect(plan.stats.learner.blockedDuplicate).toBe(3);
  });

  it("produces a masked review list", () => {
    expect(plan.review.length).toBe(3);
    const md = reviewListMarkdown(plan);
    const csv = reviewListCsv(plan);
    for (const text of [md, csv, rejectionReportMarkdown(plan)]) {
      expect(text).not.toMatch(/9876543\d{3}/);
      expect(text).not.toMatch(/[A-Za-z0-9._-]@/); // e-mail local parts never appear
      expect(text).not.toContain("Synthetic");
      expect(text).not.toContain("Learner");
    }
    expect(md).toContain("BLOCKED_DUPLICATE");
    expect(md).toContain("learner#2");
  });

  it("blocks people whose contacts already belong to users the loader does not own", () => {
    const first = plan.people.find((p) => p.legacyType === "faculty" && p.legacyId === "1")!;
    const blocked = buildPlan(snapshot, {
      today: TODAY,
      externalConflicts: { phones: new Set<string>(), emails: new Set([first.data.email!]) },
    });
    expect(blocked.blocked.find((b) => b.reason === "BLOCKED_DUPLICATE_EXISTING")?.legacyId).toBe("1");
    expect(blocked.people.some((p) => p.legacyType === "faculty" && p.legacyId === "1")).toBe(false);
  });

  it("defers accepted recruiters to stage 2b and rejects test recruiters", () => {
    expect(plan.deferred.filter((d) => d.entity === "recruiter").map((d) => d.legacyId)).toEqual(["1"]);
    expect(reasons("recruiter")).toEqual(["2:NAME_TESTWORD"]);
    expect(plan.people.some((p) => p.legacyType === "recruiter")).toBe(false);
  });

  it("builds profile documents that never contain identity numbers", () => {
    const learner = plan.people.find((p) => p.legacyType === "learner" && p.legacyId === "1")!;
    expect(learner.data.learner?.document.identity).toEqual({ aadhaarNumber: "", panNumber: "" });
    expect((learner.data.learner?.document.education as unknown[]).length).toBe(1);
  });

  it("changes a person's hash when a mapped value changes", () => {
    const tables = fixtureTables();
    tables.learner[0].first_name = "Renamed";
    const changed = buildPlan(toSnapshot(tables), { today: TODAY });
    const before = plan.people.find((p) => p.legacyType === "learner" && p.legacyId === "1")!;
    const after = changed.people.find((p) => p.legacyType === "learner" && p.legacyId === "1")!;
    expect(after.newId).toBe(before.newId);
    expect(after.hash).not.toBe(before.hash);
  });

  it("builds a reconciliation with legacy, planned and rejected counts", () => {
    const rec = buildReconciliation(plan, {}, { mode: "dry-run", batchId: null, snapshotSha256: snapshot.manifest.snapshotSha256, loaderVersion: "test" });
    const dept = rec.entities.find((e) => e.entity === "department")!;
    expect(dept).toMatchObject({ legacy: 5, planned: 2, rejected: 3 });
    const learner = rec.entities.find((e) => e.entity === "learner")!;
    expect(learner.legacy).toBe(9);
    expect(learner.planned + learner.rejected + learner.blockedDuplicate).toBe(9);
  });
});

describe("snapshot integrity", () => {
  function writeSnapshot(dir: string) {
    const tables = fixtureTables();
    const snap = toSnapshot(tables);
    mkdirSync(dir, { recursive: true });
    for (const [name, rows] of Object.entries(tables)) {
      writeFileSync(path.join(dir, `${name}.ndjson`), toNdjson(rows));
    }
    writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(snap.manifest));
  }

  it("reads a valid snapshot and refuses any tampering", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "nsrit-snap-"));
    try {
      writeSnapshot(dir);
      const ok = readSnapshot(dir);
      expect(ok.tables.learner.length).toBe(9);

      const file = path.join(dir, "learner.ndjson");
      const original = readFileSync(file, "utf8");
      writeFileSync(file, original.replace("Learner1", "Learnerx"));
      expect(() => readSnapshot(dir)).toThrow(SnapshotIntegrityError);
      writeFileSync(file, original);
      expect(() => readSnapshot(dir)).not.toThrow();

      const manifestPath = path.join(dir, "manifest.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
      manifest.snapshotSha256 = "0".repeat(64);
      writeFileSync(manifestPath, JSON.stringify(manifest));
      expect(() => readSnapshot(dir)).toThrow(/digest/);

      rmSync(path.join(dir, "faculty.ndjson"));
      expect(() => readSnapshot(dir)).toThrow(SnapshotIntegrityError);
      expect(readdirSync(dir).length).toBeGreaterThan(5);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses a directory without a manifest", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "nsrit-empty-"));
    try {
      expect(() => readSnapshot(dir)).toThrow(/manifest/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("messaging safety (static)", () => {
  it("the loader sources never reference outbox, notification, sms or mail tables or providers", () => {
    const dir = path.resolve(__dirname, "../../scripts/migrate/nsrit");
    const forbidden = /outbox|in_app_notifications|outbound_messages|notification_|\bsms\b|zeptomail|exotel|sendgrid|nodemailer|messaging\/providers/i;
    const offenders: string[] = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
      const lines = readFileSync(path.join(dir, file), "utf8").split("\n");
      lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
        if (forbidden.test(line)) offenders.push(`${file}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it("no source file in the loader writes outside the allowlist", () => {
    const dir = path.resolve(__dirname, "../../scripts/migrate/nsrit");
    const sql = readFileSync(path.join(dir, "db.ts"), "utf8");
    const tables = [...sql.matchAll(/(?:INSERT INTO|UPDATE|DELETE FROM)\s+([a-z_]+)/g)].map((m) => m[1]);
    const guard = readFileSync(path.join(dir, "guards.ts"), "utf8");
    for (const table of new Set(tables)) {
      if (["SET", "set"].includes(table)) continue;
      expect(guard).toContain(`"${table}"`);
    }
  });
});
