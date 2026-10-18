import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAdminProjectsQuery } from "@/modules/projects/admin-projects-query-model";
import { parseProjectAdminRiskQuery } from "@/modules/projects/admin-risk-query-model";
import { parseProjectAdminSubmissionsQuery } from "@/modules/projects/admin-submissions-query-model";

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
    for (const name of ["admin-insights-service", "admin-unsubmitted-service"]) {
      const code = source(name);
      expect(code, name).toMatch(/page:\s*z\.coerce\.number\(\)\.int\(\)\.min\(1\)\.max\(100000\)\.default\(1\)/);
      expect(code, name).toMatch(/pageSize:\s*z\.coerce\s*\.number\(\)\s*\.int\(\)\s*\.min\(10\)\s*\.max\(100\)/);
    }
  });
});
