import { describe, expect, it } from "vitest";
import { driveInterviewsParams, driveInterviewsQuerySchema, driveInterviewsHref, driveRoundTime } from "@/modules/placements/college-drive-interviews-model";
describe("College drive interview filters",()=>{
  it("rejects forged college, invalid round status, and duplicate query params",()=>{
    expect(driveInterviewsQuerySchema.parse({})).toMatchObject({kind:"ALL",status:"ALL",page:1,appointmentPage:1,appointmentPageSize:20,appointmentSort:"DATE_ASC",candidatePage:1,candidatePageSize:1000});
    for(const bad of [{collegeId:"foreign"},{kind:"TEST"},{status:"UNKNOWN"},{page:1001}]){
      expect(driveInterviewsQuerySchema.safeParse(bad).success).toBe(false);
    }
    expect(driveInterviewsParams({page:["1","2"]})).toBeNull();
  });
  it("does not invent interview slots, times or timezone",()=>{
    expect(driveRoundTime(null,null)).toBe("Not scheduled");
    expect(driveRoundTime(new Date("2026-10-14T10:00:00Z"),null)).toContain("Timezone not recorded");
    expect(driveInterviewsHref("valid-id",{kind:"GD",status:"ALL",page:2})).toContain("kind=GD");
  });
});
