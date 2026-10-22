import { describe, expect, it } from "vitest";
import { driveApplicationsQuerySchema, driveApplicationsHref, driveApplicationsParams, driveApplicationsExportParams } from "@/modules/placements/college-drive-applications-model";
import { placementReportCsvCell } from "@/modules/placements/report-model";

describe("College drive applicant filters and CSV protection", () => {
  it("validates bounded status filters and forbids caller college", () => {
    expect(driveApplicationsQuerySchema.parse({})).toEqual({q:"",status:"ALL",screening:"ALL",source:"ALL",stage:"ALL",skills:"",attention:"ALL",sort:"SCORE_DESC",page:1,size:20});
    for(const input of [{collegeId:"bad"},{page:0},{page:1001},{status:"UNKNOWN"},{screening:"SCORED"}]) {
      expect(driveApplicationsQuerySchema.safeParse(input).success).toBe(false);
    }
    expect(driveApplicationsParams({page:["1","2"]})).toBeNull();
  });
  it("builds distinct page and export URLs without page leakage", () => {
    const jobId="11111111-1111-4111-8111-111111111111";
    const q=driveApplicationsQuerySchema.parse({q:"a & b",status:"SUBMITTED",screening:"ALL",page:3});
    expect(driveApplicationsHref(jobId,q,true)).not.toContain("page=");
    expect(new URL(driveApplicationsHref(jobId,q),"https://example.test").searchParams.get("q")).toBe("a & b");
    expect(new URL(driveApplicationsHref(jobId,{...q,sort:"AGE_ASC"}),"https://example.test").searchParams.get("sort")).toBe("AGE_ASC");
  });
  it("exports the exact shortlist filters without widening invalid or duplicate inputs",()=>{
    const url=new URLSearchParams({
      q:"database",status:"SUBMITTED",stage:"ASSESSMENT",screening:"SHORTLISTED",
      source:"INTERNAL",skills:"Java",attention:"STALE_APPLICATIONS",
      appliedAfter:"2026-10-01",appliedBefore:"2026-10-22",
      departmentId:"11111111-1111-4111-8111-111111111111",
    });
    const parsed=driveApplicationsExportParams(url);
    expect(parsed.ok).toBe(true);
    if(parsed.ok){
      expect(parsed.query).toMatchObject({
        q:"database",status:"SUBMITTED",stage:"ASSESSMENT",
        screening:"SHORTLISTED",source:"INTERNAL",skills:"Java",
        attention:"STALE_APPLICATIONS",
        appliedFrom:"2026-10-01",appliedTo:"2026-10-22",
        departmentId:"11111111-1111-4111-8111-111111111111",
      });
    }
    expect(driveApplicationsExportParams(new URLSearchParams("stage=ASSESSMENT&stage=ALL")))
      .toMatchObject({ok:false,status:400});
    expect(driveApplicationsExportParams(new URLSearchParams("stage=TYPO")))
      .toMatchObject({ok:false,status:400});
    expect(driveApplicationsExportParams(new URLSearchParams("source=ALL&untrusted=1")))
      .toMatchObject({ok:false,status:400});
    expect(driveApplicationsExportParams(new URLSearchParams("minScore=80")))
      .toMatchObject({ok:false,status:422});
    expect(driveApplicationsExportParams(new URLSearchParams("appliedFrom=2026-10-20&appliedTo=2026-10-01")))
      .toMatchObject({ok:false,status:400});
  });
  it("neutralizes spreadsheet formulas through the canonical CSV serializer", () => {
    expect(placementReportCsvCell("=1+1")).toBe("\"'=1+1\"");
    expect(placementReportCsvCell("+42")).toBe("\"'+42\"");
  });
});
