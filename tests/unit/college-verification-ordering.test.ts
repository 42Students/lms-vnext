import {describe,expect,it} from "vitest";
import {orderVerificationQueue} from "@/modules/verification/queue-order";
describe("Verification request page ordering",()=>{
 const base=[
  {learnerMembershipId:"b",section:"IDENTITY" as const,submittedAt:new Date("2026-10-14T00:00:00Z")},
  {learnerMembershipId:"a",section:"EDUCATION" as const,submittedAt:new Date("2026-10-15T00:00:00Z")},
  {learnerMembershipId:"a",section:"IDENTITY" as const,submittedAt:new Date("2026-10-15T00:00:00Z")},
 ];
 it("preserves chosen chronological direction and has stable secondary ties",()=>{
  expect(orderVerificationQueue(base,"NEWEST").map(x=>x.section)).toEqual(["EDUCATION","IDENTITY","IDENTITY"]);
  expect(orderVerificationQueue(base,"OLDEST")[0]?.learnerMembershipId).toBe("b");
  expect(orderVerificationQueue(base)[0]?.learnerMembershipId).toBe("b");
  expect(base[0]?.learnerMembershipId).toBe("b");
 });
});
