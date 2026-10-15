import {describe,it,expect} from "vitest";
import {previewVerificationBulk} from "@/modules/verification/bulk-preview";
describe("bulk verification preview",()=>{it("skips duplicate and already decided submissions",()=>{
 const a={learnerMembershipId:"a",section:"IDENTITY" as const,status:"SUBMITTED" as const,version:1};
 const b={...a,learnerMembershipId:"b",status:"VERIFIED" as const};
 const p=previewVerificationBulk([a,a,b],"VERIFY");
 expect(p.eligible).toEqual([a]);expect(p.skipped.map(x=>x.reason)).toEqual(["DUPLICATE","NOT_WAITING"]);
});});