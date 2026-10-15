import {describe,expect,it} from "vitest";
import {verificationBulkPreviewRows} from "@/modules/verification/bulk-preview-display";
describe("Readable College verification bulk confirmation preview",()=>{
 it("distinguishes eligible candidates from duplicates and non-waiting rows",()=>{
  const rows=[
   {learnerMembershipId:"m1",section:"EDUCATION" as const,learnerName:"Learner One",status:"SUBMITTED" as const,version:3},
   {learnerMembershipId:"m1",section:"EDUCATION" as const,learnerName:"Learner One",status:"SUBMITTED" as const,version:3},
   {learnerMembershipId:"m2",section:"IDENTITY" as const,learnerName:"Learner Two",status:"VERIFIED" as const,version:2},
  ];
  const preview=verificationBulkPreviewRows(rows,"VERIFY");
  expect(preview.eligible).toHaveLength(1);
  expect(preview.eligible[0]).toMatchObject({name:"Learner One",version:3});
  expect(preview.skipped.map(item=>item.reason)).toEqual(["DUPLICATE","NOT_WAITING"]);
 });
});
