import {describe,expect,it} from "vitest";
import {
  drivePayCategoryFromMaxAnnualCtcInr,drivePayCategoryFromMaxCtcLpa,drivePayCategoryOverrideIssue,
} from "@/modules/placements/drive-pay-category-model";
import {tpoDriveEditSchema,type TpoDriveEditInput} from "@/modules/placements/tpo-drive-edit-model";

const edit={confirmed:true as const,expectedUpdatedAt:"2026-10-14T14:00:00.123Z",
 reason:"Revise opening details",title:"Engineer",description:"Updated draft",locations:["Hyderabad"],
 openings:2,minimumAnnualCtcInr:500000,maximumAnnualCtcInr:1000000,
 applicationDeadline:"2026-10-30T14:00:00.000Z",minCgpaHundredths:null,
 fixedCtcLpa:null,variableCtcLpa:null,stipendPerMonthInr:null,isDream:false,notifyApplicants:false} satisfies TpoDriveEditInput;

describe("legacy drive pay category",()=>{
  it("derives the tier from the highest CTC with the legacy thresholds",()=>{
    expect(drivePayCategoryFromMaxCtcLpa(null)).toBe("REGULAR");
    expect(drivePayCategoryFromMaxCtcLpa(9.99)).toBe("REGULAR");
    expect(drivePayCategoryFromMaxCtcLpa(10)).toBe("DREAM");
    expect(drivePayCategoryFromMaxCtcLpa(19.99)).toBe("DREAM");
    expect(drivePayCategoryFromMaxCtcLpa(20)).toBe("SUPER_DREAM");
    expect(drivePayCategoryFromMaxAnnualCtcInr(2_000_000)).toBe("SUPER_DREAM");
  });
  it("requires a reason for an override and a category for a reason",()=>{
    expect(drivePayCategoryOverrideIssue({legacyJobCategory:"DREAM",categoryOverrideReason:" "}))
      .toMatchObject({path:"categoryOverrideReason",message:"A reason is required"});
    expect(drivePayCategoryOverrideIssue({legacyJobCategory:null,categoryOverrideReason:"why"}))
      .toMatchObject({path:"legacyJobCategory"});
    expect(drivePayCategoryOverrideIssue({legacyJobCategory:"DREAM",categoryOverrideReason:"Stipend counts"})).toBeNull();
    expect(drivePayCategoryOverrideIssue({legacyJobCategory:null,categoryOverrideReason:null})).toBeNull();
  });
  it("enforces the override reason in the TPO drive edit schema",()=>{
    expect(tpoDriveEditSchema.safeParse({...edit,legacyJobCategory:"SUPER_DREAM",categoryOverrideReason:null}).success).toBe(false);
    expect(tpoDriveEditSchema.safeParse({...edit,legacyJobCategory:"SUPER_DREAM",categoryOverrideReason:"Offer letter"}).success).toBe(true);
    expect(tpoDriveEditSchema.safeParse({...edit,legacyJobCategory:null,categoryOverrideReason:null}).success).toBe(true);
    expect(tpoDriveEditSchema.safeParse(edit).success).toBe(true);
  });
});
