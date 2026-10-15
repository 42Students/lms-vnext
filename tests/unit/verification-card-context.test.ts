import {describe,it,expect} from "vitest";
import {matchesVerificationSearch} from "@/modules/verification/queue-search";
describe("verified card context",()=>{it("filters by batch and branch names once loaded",()=>{
 expect(matchesVerificationSearch({learnerName:"A",batchName:"CSE-2026",branchName:"Computer Science",section:"EDUCATION"},"computer")).toBe(true);
});});
