import {describe,it,expect} from "vitest";
import {selectVerificationQueue} from "@/modules/verification/queue-composition";
describe("composed queue filters",()=>{it("selects pending education with missing evidence",()=>{
 const row={learnerMembershipId:"a",learnerName:"Ana",batchName:"2027",branchName:"CSE",section:"EDUCATION" as const,status:"UPDATE_PENDING" as const,submittedAt:new Date(0),submittedSnapshot:{education:[{id:"x"}]}};
 expect(selectVerificationQueue([row],{tab:"WAITING",kind:"EDUCATION",marksheets:"MISSING"})).toEqual([row]);
 expect(selectVerificationQueue([row],{tab:"VERIFIED"})).toEqual([]);
});});