import { describe, expect, it } from "vitest";
import {
  CONFIRM_TOKEN,
  DESTRUCTIVE_NAME,
  exportedMethods,
  hopSources,
  read,
  rel,
  routeFiles,
} from "./phase3-scan-helpers";

/**
 * Destructive-looking Super Admin routes (path names delete, restore, terminate,
 * merge, bulk, revoke ..., or any DELETE handler) must reach a server-side
 * confirmation: a z.literal(true) acknowledgement, a typed confirmation, or an
 * optimistic-concurrency token (expectedUpdatedAt / expectedVersion /
 * expectedStatus) within three import hops.
 */
const DESTRUCTIVE = routeFiles("src/app/api/admin")
  .map((abs) => ({ abs, file: rel(abs), methods: exportedMethods(read(abs)) }))
  .filter((r) => r.methods.some((m) => m !== "GET") && (DESTRUCTIVE_NAME.test(r.file) || r.methods.includes("DELETE")));

/** Name matches that are not destructive; each needs a reason. */
const NOT_DESTRUCTIVE: Record<string, string> = {
  "src/app/api/admin/colleges/bulk-import/route.ts":
    "Create-only CSV import: existing college codes are skipped, never overwritten, and college.manage is required (see bulkImportColleges).",
};

describe("Phase 3: destructive Super Admin routes demand a server-side confirmation or version token", () => {
  it("finds a realistic set of destructive-looking routes", () => {
    expect(DESTRUCTIVE.length).toBeGreaterThanOrEqual(15);
  });

  it("each one carries a confirmation or version token within three hops", () => {
    const missing = DESTRUCTIVE.filter(
      ({ abs, file }) => !(file in NOT_DESTRUCTIVE) && !CONFIRM_TOKEN.test(hopSources(abs, 3)),
    ).map((r) => r.file);
    expect(missing, `destructive routes without confirmation: ${missing.join(", ")}`).toEqual([]);
  });

  it("the drive archive keeps its preview step and expectedUpdatedAt check", () => {
    const route = read("src/app/api/admin/placements/jobs/[jobId]/delete/route.ts");
    expect(route).toMatch(/previewSuperAdminDriveArchive/);
    expect(hopSources("src/app/api/admin/placements/jobs/[jobId]/delete/route.ts", 2)).toMatch(/expectedUpdatedAt/);
  });

  it("bulk course visibility keeps its literal confirmation and 100-item cap", () => {
    const svc = read("src/modules/courses/super-admin-course-bulk-visibility.ts");
    expect(svc).toMatch(/confirmed:z\.literal\(true\)/);
    expect(svc).toMatch(/\.max\(100\)/);
  });

  it("the detector accepts real tokens and rejects look-alikes", () => {
    expect(CONFIRM_TOKEN.test("confirmed:z.literal(true)")).toBe(true);
    expect(CONFIRM_TOKEN.test("input.expectedUpdatedAt")).toBe(true);
    expect(CONFIRM_TOKEN.test("// confirmed by the user")).toBe(false);
    expect(CONFIRM_TOKEN.test("const confirmed = true")).toBe(false);
  });

  it("every exemption has a written reason and still names an existing route", () => {
    for (const [file, reason] of Object.entries(NOT_DESTRUCTIVE)) {
      expect(reason.length, `${file} needs a reason`).toBeGreaterThan(20);
      expect(DESTRUCTIVE.some((r) => r.file === file), `${file} no longer matches the destructive pattern`).toBe(true);
    }
  });
});
