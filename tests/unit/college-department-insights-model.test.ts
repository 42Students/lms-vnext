import { describe, expect, it } from "vitest";
import {
  attendanceEvidenceLabel,
  collegeDepartmentInsightsQuerySchema,
  departmentInsightsHref,
  departmentInsightsPageCount,
  departmentInsightsQueryFromSearchParams,
  readinessEvidenceLabel,
} from "@/modules/admin-ui/college-department-insights-model";

describe("College department evidence models", () => {
  it("accepts only bounded search/page values with no college override", () => {
    expect(collegeDepartmentInsightsQuerySchema.parse({})).toEqual({ q: "", page: 1 });
    expect(collegeDepartmentInsightsQuerySchema.parse({ q: "  CSE  ", page: "2" }))
      .toEqual({ q: "CSE", page: 2 });
    for (const raw of [
      { collegeId: "other" }, { page: 0 }, { page: 1001 },
      { q: "a".repeat(101) }, { page: ["1", "2"] },
    ]) {
      expect(collegeDepartmentInsightsQuerySchema.safeParse(raw).success).toBe(false);
    }
  });

  it("rejects duplicated search parameters and builds relative safe navigation", () => {
    const raw = departmentInsightsQueryFromSearchParams({ q: ["CSE", "ECE"], page: "1" });
    expect(collegeDepartmentInsightsQuerySchema.safeParse(raw).success).toBe(false);
    const target = new URL(departmentInsightsHref("PLACEMENT_READINESS", {
      q: "A & B", page: 3,
    }), "https://example.test");
    expect(target.pathname).toBe("/college/placements/readiness-by-department");
    expect(target.searchParams.get("q")).toBe("A & B");
    expect(target.searchParams.has("collegeId")).toBe(false);
    expect(departmentInsightsHref("ATTENDANCE", { q: "", page: 1 }))
      .toBe("/college/attendance/departments");
    expect(departmentInsightsPageCount(0)).toBe(1);
    expect(departmentInsightsPageCount(26)).toBe(2);
  });

  it("does not manufacture attendance percentages or learner denominators", () => {
    expect(attendanceEvidenceLabel({ markedSessions: 0, recordedRows: 0 }))
      .toBe("No marked sessions recorded");
    expect(attendanceEvidenceLabel({ markedSessions: 2, recordedRows: 0 }))
      .toContain("no explicit learner status rows");
    expect(attendanceEvidenceLabel({ markedSessions: 2, recordedRows: 4 }))
      .toBe("4 explicit learner-status records");
  });

  it("clearly labels profile evidence as not equivalent to placement eligibility", () => {
    expect(readinessEvidenceLabel({ learners: 0, evidenceProfiles: 0, verifiedProfiles: 0 }))
      .toBe("No active enrolled learners recorded");
    expect(readinessEvidenceLabel({ learners: 8, evidenceProfiles: 3, verifiedProfiles: 2 }))
      .toBe("3 academic evidence profiles (2 verified) of 8 active enrolled learners; eligibility not evaluated");
  });
});
