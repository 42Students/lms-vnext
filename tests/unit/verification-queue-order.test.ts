import {describe,it,expect} from "vitest";
import {orderVerificationQueue} from "@/modules/verification/queue-order";
describe("queue stable sort",()=>{it("prioritizes the oldest and never mutates source",()=>{
 const rows=[{learnerMembershipId:"b",section:"IDENTITY" as const,submittedAt:new Date(5)},{learnerMembershipId:"a",section:"EDUCATION" as const,submittedAt:new Date(5)},{learnerMembershipId:"c",section:"EDUCATION" as const,submittedAt:new Date(1)}];
 expect(orderVerificationQueue(rows).map(x=>x.learnerMembershipId)).toEqual(["c","a","b"]);
 expect(rows[0].learnerMembershipId).toBe("b");
});});