import {describe,it,expect} from "vitest";
import {describeBulkReviewOutcomeRows} from "@/modules/verification/bulk-outcome";
describe("College verification per-request bulk result labels",()=>{
 it("shows authorized learner names, not raw identity IDs",()=>{
  const id="00000000-0000-4000-8000-000000000101";
  const rows=describeBulkReviewOutcomeRows([
    {learnerMembershipId:id,section:"EDUCATION",result:"VERIFIED"},
    {learnerMembershipId:"00000000-0000-4000-8000-000000000102",section:"IDENTITY",result:"STALE_VERSION"},
  ],[{learnerMembershipId:id,section:"EDUCATION",learnerName:"Akhil"}]);
  expect(rows[0]).toMatchObject({label:"Akhil",result:"VERIFIED"});
  expect(rows[1]).toMatchObject({label:"Selected learner",result:"STALE_VERSION"});
  expect(rows[1]?.message).toContain("refresh");
  expect(rows[1]?.label).not.toContain("00000000");
 });
});
