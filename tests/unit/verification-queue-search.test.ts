import {describe,it,expect} from "vitest";
import {matchesVerificationSearch} from "@/modules/verification/queue-search";
describe("verification search",()=>{it("matches names, batch and branch without exposing contact",()=>{
 const row={learnerName:"Asha Rao",batchName:"2027",branchName:"CSE",section:"EDUCATION" as const};
 expect(matchesVerificationSearch(row," asha ")).toBe(true);
 expect(matchesVerificationSearch(row,"cse")).toBe(true);
 expect(matchesVerificationSearch(row,"email@example.com")).toBe(false);
});});