import {describe,it,expect} from "vitest";
import {displayVerificationQueueOrder} from "@/modules/verification/queue-order";
describe("Verification SQL-backed page order",()=>{
 const rows=[
  {learnerMembershipId:"b",learnerName:"Z",section:"EDUCATION" as const,submittedAt:new Date("2026-10-10")},
  {learnerMembershipId:"a",learnerName:"A",section:"IDENTITY" as const,submittedAt:new Date("2026-10-15")},
 ];
 it("retains server order exactly on paginated college pages",()=>{
  expect(displayVerificationQueueOrder(rows,"NAME",true).map(x=>x.learnerMembershipId)).toEqual(["b","a"]);
  expect(displayVerificationQueueOrder(rows,"NAME",false).map(x=>x.learnerMembershipId)).toEqual(["a","b"]);
  expect(rows[0]?.learnerName).toBe("Z");
 });
});
