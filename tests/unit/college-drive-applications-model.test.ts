import { describe, expect, it } from "vitest";
import { driveApplicationsQuerySchema, driveApplicationsHref, driveApplicationsParams } from "@/modules/placements/college-drive-applications-model";
import { placementReportCsvCell } from "@/modules/placements/report-model";

describe("College drive applicant filters and CSV protection", () => {
  it("validates bounded status filters and forbids caller college", () => {
    expect(driveApplicationsQuerySchema.parse({})).toEqual({q:"",status:"ALL",screening:"ALL",source:"ALL",stage:"ALL",page:1});
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
  });
  it("neutralizes spreadsheet formulas through the canonical CSV serializer", () => {
    expect(placementReportCsvCell("=1+1")).toBe("\"'=1+1\"");
    expect(placementReportCsvCell("+42")).toBe("\"'+42\"");
  });
});
