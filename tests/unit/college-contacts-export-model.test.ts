import {describe,it,expect} from "vitest";
import {renderCollegeContactCsv,parseCollegeContactsExportParams} from "@/modules/people/college-contacts-export-model";
describe("college contacts CSV",()=>{it("neutralizes formulas and caps output",()=>{
 const row={membershipId:"m",name:"=HYPERLINK(test)",roles:["LEARNER" as const],email:"s•••@college.edu",phone:"•••• 4321",status:"ACTIVE" as const,joinedAt:new Date("2026-10-15T02:00:00Z")};
 const csv=renderCollegeContactCsv(Array.from({length:1001},()=>row),true);
 expect(csv).toContain("'=HYPERLINK(test)");
 expect(csv).toContain("EXPORT TRUNCATED");
 expect(csv.split("\r\n").length).toBe(1003);
 expect(csv).not.toContain("student@college.edu");
});
it("refuses duplicated query keys and college overrides",()=>{
 expect(()=>parseCollegeContactsExportParams(new URLSearchParams("tab=ALL&tab=STUDENT"))).toThrow("INVALID_CONTACT_EXPORT");
 expect(()=>parseCollegeContactsExportParams(new URLSearchParams("collegeId=foreign"))).toThrow();
});});
