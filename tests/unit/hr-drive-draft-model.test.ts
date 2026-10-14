import { describe, expect, it } from "vitest";
import {
  emptyHrDriveDraft, hrDriveDraftQuerySchema, hrDriveDraftSchema, hrDraftFromAuthorizedJob,
} from "@/modules/placements/hr-drive-draft-model";

describe("HR recruiter Request Drive draft preview", () => {
  it("rejects unscoped or conflicting Hire Again and Fix input", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(hrDriveDraftQuerySchema.safeParse({ from: id, fix: id }).success).toBe(false);
    expect(hrDriveDraftQuerySchema.safeParse({ from: "another-company" }).success).toBe(false);
    expect(hrDriveDraftQuerySchema.safeParse({ collegeId: id }).success).toBe(true);
  });

  it("prefills a draft from an already-authorized job without saving anything", () => {
    const draft = hrDraftFromAuthorizedJob({
      title: "Software Engineer", description: "Build important applications in the team.",
      locations: ["Hyderabad"], employmentType: "FULL_TIME", workMode: "HYBRID",
      minimumAnnualCtcInr: 500000, maximumAnnualCtcInr: 750000,
    }, [{ kind: "INTERVIEW", name: "Technical interview" }]);
    expect(draft.title).toBe("Software Engineer");
    expect(draft.rounds).toEqual([{ kind: "INTERVIEW", name: "Technical interview" }]);
    expect(draft.fixedAnnualCtcInr).toBe("");
    expect(draft.maximumActiveBacklogs).toBe("");
    expect(hrDriveDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("requires valid input and rejects inverted CTC", () => {
    const draft = emptyHrDriveDraft();
    expect(hrDriveDraftSchema.safeParse(draft).success).toBe(false);
    expect(hrDriveDraftSchema.safeParse({
      ...draft, title: "Engineer", description: "Enough detail to validate this role.",
      location: "Hyderabad", minimumAnnualCtcInr: "700000",
      maximumAnnualCtcInr: "600000",
    }).success).toBe(false);
    expect(hrDriveDraftSchema.safeParse({
      ...draft, title: "Engineer", description: "Enough detail to validate this role.",
      location: "Hyderabad", bondMonths: "121",
    }).success).toBe(false);
    expect(hrDriveDraftSchema.safeParse({
      ...draft, title: "Engineer", description: "Enough detail to validate this role.",
      location: "Hyderabad", bondMonths: "24", maximumActiveBacklogs: "2",
      fixedAnnualCtcInr: "500000", variableAnnualCtcInr: "100000",
    }).success).toBe(true);
  });
  it("checks complete fixed/variable annual CTC against both endpoints of the advertised range", () => {
    const draft = {...emptyHrDriveDraft(), title:"Engineer",
      description:"A full-stack engineering position with clear eligibility.",
      location:"Hyderabad",minimumAnnualCtcInr:"500000",maximumAnnualCtcInr:"750000",
      fixedAnnualCtcInr:"500000",variableAnnualCtcInr:"100000"};
    expect(hrDriveDraftSchema.safeParse(draft).success).toBe(true);
    expect(hrDriveDraftSchema.safeParse({...draft,variableAnnualCtcInr:"300000"}).success).toBe(false);
    expect(hrDriveDraftSchema.safeParse({...draft,fixedAnnualCtcInr:"350000"}).success).toBe(false);
    // An unspecified component does not assert a complete salary breakdown.
    expect(hrDriveDraftSchema.safeParse({...draft,variableAnnualCtcInr:""}).success).toBe(true);
  });

});
