import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAdminProjectsQuery } from "@/modules/projects/admin-projects-query-model";
import { parseProjectAdminRiskQuery } from "@/modules/projects/admin-risk-query-model";
import { parseProjectAdminSubmissionsQuery } from "@/modules/projects/admin-submissions-query-model";
import { adminUnsubmittedQuerySchema } from "@/modules/projects/admin-unsubmitted-query-model";
import { projectAdminServiceQuerySchema } from "@/modules/projects/admin-service-query-model";

const source = (name: string) => readFileSync(
  join(process.cwd(), "src/modules/projects", name + ".ts"), "utf8",
);

describe("IIT Dharwad Projects: hostile pagination never triggers an unbounded database offset", () => {
  it("PROJ-BREAK-scale-20 models reject nonfinite, huge and fraction pages for all admin lists", () => {
    for (const parse of [parseAdminProjectsQuery, parseProjectAdminRiskQuery,
      parseProjectAdminSubmissionsQuery]) {
      for (const page of ["1e309", "100001", "-1", "0", "1.5", "NaN"]) {
        expect(parse({ page }).success, page).toBe(false);
      }
      expect(parse({ page: "100000", pageSize: "100" }).success).toBe(true);
    }
  });
  it("PROJ-BREAK-scale-21 service entrypoints enforce bounds even if API validation is bypassed", () => {
    const snapshots = source("admin-insights-service");
    // Direct service calls must use exactly the same strict, bounded model;
    // accepting exponent/hex/blank input because of z.coerce would re-open
    // the very offset and DoS class the page URL parsers now close.
    expect(snapshots).toContain("const projectAdminQuerySchema = projectAdminServiceQuerySchema");
    expect(snapshots).toContain("projectAdminQuerySchema.parse(rawQuery)");
    expect(snapshots).toContain("projectSubmissionQueueQuerySchema");
    for (const page of ["0x10", "1e2", "", " ", "-1", "0", "100001", "1.5", "NaN", "Infinity", ["1", "2"]]) {
      expect(projectAdminServiceQuerySchema.safeParse({page}).success, JSON.stringify(page)).toBe(false);
    }
    for (const pageSize of ["0x20", "1e2", "", " ", "0", "9", "101", "1.5", ["10", "20"]]) {
      expect(projectAdminServiceQuerySchema.safeParse({pageSize}).success, JSON.stringify(pageSize)).toBe(false);
    }
    expect(projectAdminServiceQuerySchema.safeParse({page:100000,pageSize:100}).success).toBe(true);
    const unsubmitted = source("admin-unsubmitted-service");
    expect(unsubmitted).toContain("adminUnsubmittedQuerySchema.parse(raw)");
    expect(unsubmitted.indexOf("adminUnsubmittedQuerySchema.parse(raw)"))
      .toBeLessThan(unsubmitted.indexOf("loadProjectCollegeScope(collegeId)"));
    expect(adminUnsubmittedQuerySchema.safeParse({page:100000,pageSize:100}).success).toBe(true);
    for(const page of ["-1","0","100001","1.5","NaN","Infinity"]) {
      expect(adminUnsubmittedQuerySchema.safeParse({page}).success,page).toBe(false);
    }
    for(const pageSize of ["0","9","101","1.5","Infinity"]) {
      expect(adminUnsubmittedQuerySchema.safeParse({pageSize}).success,pageSize).toBe(false);
    }
  });
});
