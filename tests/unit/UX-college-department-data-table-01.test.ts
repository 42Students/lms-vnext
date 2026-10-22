import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {
  attendanceEvidenceLabel,readinessEvidenceLabel,
  departmentInsightsHref,collegeDepartmentInsightsQuerySchema,
  departmentInsightsPageCount,
} from "@/modules/admin-ui/college-department-insights-model";

describe("UX-college-department-data-table-01 evidence reports",()=>{
  const source=readFileSync(join(process.cwd(),"src/components/college/college-department-insights.tsx"),"utf8");
  it("shows all department evidence with mobile-first shared DataTable and genuine empty copy",()=>{
    expect(source).toContain("DataTableColumn<Data");
    expect(source).toContain("<DataTable columns={columns} rows={data.items}");
    for(const field of ["markedSessions","learners","attendanceEvidenceLabel(item)","readinessEvidenceLabel(item)","item.absent","item.preferenceProfiles"])
      expect(source).toContain(field);
    expect(source).toContain("No departments match these filters.");
    expect(source).toContain('mobilePriority:"primary"');
    expect(source).toContain('mobilePriority:"secondary"');
    expect(source).not.toContain("<table");
    expect(source).toContain('className="min-h-11 w-full md:min-h-9 md:w-auto"');
    expect(source).toContain("focus-visible:outline-2");
  });
  it("does not infer attendance percentages from a missing denominator",()=>{
    expect(attendanceEvidenceLabel({markedSessions:0,recordedRows:0})).toBe("No marked sessions recorded");
    expect(attendanceEvidenceLabel({markedSessions:3,recordedRows:0})).toContain("no explicit learner status rows");
    expect(attendanceEvidenceLabel({markedSessions:3,recordedRows:7})).toBe("7 explicit learner-status records");
    expect(readinessEvidenceLabel({learners:0,evidenceProfiles:0,verifiedProfiles:0})).toBe("No active enrolled learners recorded");
    expect(readinessEvidenceLabel({learners:10,evidenceProfiles:4,verifiedProfiles:2})).toContain("eligibility not evaluated");
  });
  it("rejects invalid or other-tenant filter controls and preserves safely encoded pagination",()=>{
    expect(collegeDepartmentInsightsQuerySchema.safeParse({q:"ok",page:2}).success).toBe(true);
    expect(collegeDepartmentInsightsQuerySchema.safeParse({q:"ok",page:0}).success).toBe(false);
    expect(collegeDepartmentInsightsQuerySchema.safeParse({q:"ok",page:2,collegeId:"other"}).success).toBe(false);
    expect(collegeDepartmentInsightsQuerySchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
    expect(departmentInsightsPageCount(0)).toBe(1);
    expect(departmentInsightsPageCount(26)).toBe(2);
    expect(departmentInsightsHref("ATTENDANCE",{q:"IT & CSE",page:2})).toBe("/college/attendance/departments?q=IT+%26+CSE&page=2");
    expect(departmentInsightsHref("PLACEMENT_READINESS",{q:"",page:1})).toBe("/college/placements/readiness-by-department");
  });
});
