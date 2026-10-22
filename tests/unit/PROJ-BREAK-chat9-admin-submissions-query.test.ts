import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseProjectAdminSubmissionsQuery } from "@/modules/projects/admin-submissions-query-model";

describe("IIT Dharwad Projects: admin submissions dashboard URL breaker", () => {
  it("PROJ-BREAK-ux-17 preserves the exact authorized status, list and view filters", () => {
    expect(parseProjectAdminSubmissionsQuery({})).toMatchObject({
      success:true,data:{view:"ALL",page:1,pageSize:25},
    });
    expect(parseProjectAdminSubmissionsQuery({
      view:"ALL",q:"  capstone  ",status:"ACTIVE",
      submissionStatus:"UNDER_REVIEW",page:"3",pageSize:"50",
    })).toMatchObject({
      success:true,data:{view:"ALL",q:"capstone",status:"ACTIVE",
        submissionStatus:"UNDER_REVIEW",page:3,pageSize:50},
    });
    // The not-submitted workspace view cannot apply a submission-state filter.
    expect(parseProjectAdminSubmissionsQuery({view:"NOT_SUBMITTED",q:" capstone ",
      status:"ACTIVE",page:"3"})).toMatchObject({
      success:true,data:{view:"NOT_SUBMITTED",q:"capstone",status:"ACTIVE",page:3},
    });
    expect(parseProjectAdminSubmissionsQuery({view:"NOT_SUBMITTED",
      submissionStatus:"UNDER_REVIEW"}).success).toBe(false);
  });
  it("PROJ-BREAK-ux-18 forged status, view and unbounded pagination never hit the DB", () => {
    for(const input of [
      {view:"../../other-college"},{status:"UNKNOWN"},{submissionStatus:"RELEASED"},
      {page:"-1"},{page:"0"},{page:"1e309"},{page:"1.25"},
      {pageSize:"101"},{pageSize:"9"},{q:"x".repeat(121)},
      {page:["Infinity","2"]},
    ])expect(parseProjectAdminSubmissionsQuery(input).success,JSON.stringify(input)).toBe(false);
  });
  it("PROJ-BREAK-ux-19 the shared Admin and College page fails with an actionable inline error", () => {
    const s=readFileSync(join(process.cwd(),
      "src/components/projects/project-admin-submissions-page.tsx"),"utf8");
    expect(s.indexOf("if (!parsed.success)")).toBeGreaterThan(-1);
    expect(s.indexOf("if (!parsed.success)")).toBeLessThan(s.indexOf("listProjectAdminSubmissionQueue("));
    expect(s).toContain('title="Invalid submission filters"');
    expect(s).toContain('basePath + "/submissions"');
  });
});
