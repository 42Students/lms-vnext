import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {parseProjectAdminAuditQuery} from "@/modules/projects/admin-audit-query-model";

describe("IIT Dharwad Projects: Super Admin and College audit filter recovery",()=>{
  it("PROJ-BREAK-ux-21 preserves valid date ranges, subject filters and history cursors",()=>{
    const parsed=parseProjectAdminAuditQuery({
      subjectType:"project_task",subjectId:"workspace-a",
      from:"2026-10-01",to:"2026-10-18",
      beforeOccurredAt:"2026-10-01T00:00:00.000Z",
      beforeId:"11111111-1111-4111-8111-111111111111",
    });
    expect(parsed).toMatchObject({
      ignoredInvalidFilters:false,subjectType:"project_task",
      subjectId:"workspace-a",from:"2026-10-01",to:"2026-10-18",
      beforeOccurredAt:"2026-10-01T00:00:00.000Z",
      beforeId:"11111111-1111-4111-8111-111111111111",
    });
  });

  it("PROJ-BREAK-ux-21 reports forged and contradictory URL fields instead of broadening silently",()=>{
    for(const input of [
      {otherCollege:"11111111-1111-4111-8111-111111111111"},
      {action:["projects.created","projects.deleted"]},
      {from:"2026-02-29"},
      {from:"2026-10-18",to:"2026-10-01"},
      {beforeOccurredAt:"2026-10-01T00:00:00.000Z"},
      {beforeId:"11111111-1111-4111-8111-111111111111"},
      {subjectId:["other-college","own-college"]},
    ]){
      expect(parseProjectAdminAuditQuery(input).ignoredInvalidFilters,JSON.stringify(input)).toBe(true);
    }
    const unknown=parseProjectAdminAuditQuery({scope:"other"});
    expect(unknown.subjectType).toBeUndefined();
    expect(unknown.ignoredInvalidFilters).toBe(true);
  });

  it("PROJ-BREAK-ux-21 renders the invalid-filter notice while keeping the activity query scoped",()=>{
    const source=readFileSync("src/components/projects/project-admin-audit-page.tsx","utf8");
    expect(source).toContain("filters.ignoredInvalidFilters");
    expect(source).toContain('role="alert"');
    expect(source).toContain("Some audit filters were invalid and have been ignored.");
    expect(source).toContain('module: "PROJECTS"');
    expect(source).toContain("listActivityEvents(");
  });
});
