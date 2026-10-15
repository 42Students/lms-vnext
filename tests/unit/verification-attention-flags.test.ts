import {describe,it,expect} from "vitest";
import {verificationAttentionFlags} from "@/modules/verification/attention-flags";
describe("attention cues",()=>{it("only flags strictly more than seven days",()=>{
 const now=new Date("2026-10-15T00:00:00Z");
 const input={section:"EDUCATION" as const,status:"UPDATE_PENDING" as const,missingMarksheet:true,submittedAt:new Date("2026-10-08T00:00:00Z")};
 expect(verificationAttentionFlags(input,now)).toEqual(["MISSING_MARKSHEET","VERIFIED_DETAILS_CHANGED"]);
 expect(verificationAttentionFlags({...input,submittedAt:new Date("2026-10-07T00:00:00Z")},now)).toContain("WAITING_OVER_WEEK");
});});