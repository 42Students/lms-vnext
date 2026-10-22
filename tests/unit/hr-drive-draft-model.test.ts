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

  it("keeps existing zero-round drives optional and preserves all authorized process rows",()=>{
    const job={
      title:"Graduate Engineer",description:"Legacy employer round mapping.",
      locations:["Hyderabad"],employmentType:"FULL_TIME",workMode:"HYBRID",
      minimumAnnualCtcInr:500000,maximumAnnualCtcInr:750000,
    };
    const empty=hrDraftFromAuthorizedJob(job,[]);
    expect(empty.rounds).toEqual([]);
    expect(hrDriveDraftSchema.safeParse({...empty,ctcLpa:"10"}).success).toBe(true);
    const source=Array.from({length:13},(_,index)=>({kind:"INTERVIEW",name:"Round "+(index+1)}));
    const repeated=hrDraftFromAuthorizedJob(job,source);
    expect(repeated.rounds).toHaveLength(13);
    expect(repeated.rounds[12]?.name).toBe("Round 13");
  });

  it("does not silently drop scoped eligibility branches or hiring rounds when copying legacy drives", () => {
    const source = {
      title: "Engineer", description: "Authorized job copy",
      locations: ["Hyderabad"], employmentType: "FULL_TIME",
      workMode: "HYBRID", minimumAnnualCtcInr: 500000,
      maximumAnnualCtcInr: 750000,
    };
    const branches = Array.from({ length: 31 }, (_, index) => "Branch " + (index + 1));
    const copiedBranches = hrDraftFromAuthorizedJob({ ...source, eligibleBranches: branches }, []);
    expect(copiedBranches.branches).toEqual(branches);
    expect(hrDriveDraftSchema.safeParse(copiedBranches).success).toBe(false);

    const years = hrDraftFromAuthorizedJob({
      ...source, eligiblePassingYears: [2027, 1900, 2028],
    }, []);
    expect(years.passingYears).toEqual([2027, 1900, 2028]);
    expect(hrDriveDraftSchema.safeParse(years).success).toBe(false);

    const rounds = Array.from({ length: 101 }, (_, index) =>
      ({ kind: "INTERVIEW", name: "Round " + (index + 1) }));
    const copiedRounds = hrDraftFromAuthorizedJob(source, rounds);
    expect(copiedRounds.rounds).toHaveLength(101);
    expect(copiedRounds.rounds[100]).toEqual({ kind: "INTERVIEW", name: "Round 101" });
    expect(hrDriveDraftSchema.safeParse(copiedRounds).success).toBe(false);
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
      location: "Hyderabad", ctcLpa: "10", bondMonths: "24", maximumActiveBacklogs: "2",
      fixedAnnualCtcInr: "500000", variableAnnualCtcInr: "100000",
    }).success).toBe(true);
  });
  it("checks complete fixed/variable annual CTC against both endpoints of the advertised range", () => {
    const draft = {...emptyHrDriveDraft(), title:"Engineer",
      description:"A full-stack engineering position with clear eligibility.",
      location:"Hyderabad",ctcLpa:"7.5",minimumAnnualCtcInr:"500000",maximumAnnualCtcInr:"750000",
      fixedAnnualCtcInr:"500000",variableAnnualCtcInr:"100000"};
    expect(hrDriveDraftSchema.safeParse(draft).success).toBe(true);
    expect(hrDriveDraftSchema.safeParse({...draft,variableAnnualCtcInr:"300000"}).success).toBe(false);
    expect(hrDriveDraftSchema.safeParse({...draft,fixedAnnualCtcInr:"350000"}).success).toBe(false);
    // An unspecified component does not assert a complete salary breakdown.
    expect(hrDriveDraftSchema.safeParse({...draft,variableAnnualCtcInr:""}).success).toBe(true);
  });

  it("rejects confusing duplicate hiring-round names after spacing/case normalization",()=>{
    const draft={...emptyHrDriveDraft(),title:"Engineer",
      description:"A full role description for the college placement cell.",
      location:"Hyderabad",ctcLpa:"10",rounds:[
        {kind:"TEST" as const,name:"Technical assessment"},
        {kind:"INTERVIEW" as const,name:"  technical   ASSESSMENT  "},
      ]};
    const parsed=hrDriveDraftSchema.safeParse(draft);
    expect(parsed.success).toBe(false);
    if(!parsed.success)expect(parsed.error.issues.some(i=>i.path.join(".")==="rounds.1.name")).toBe(true);
    expect(hrDriveDraftSchema.safeParse({
      ...draft,rounds:[draft.rounds[0],{kind:"INTERVIEW" as const,name:"Panel interview"}],
    }).success).toBe(true);
  });

});
