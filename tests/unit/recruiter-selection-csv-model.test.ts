import {describe,it,expect} from "vitest";
import {parseRecruiterSelectionCsv,recruiterSelectionCsvTemplate}
 from "@/modules/placements/recruiter-selection-csv-model";
const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
describe("Recruiter selection CSV import",()=>{
 it("imports Excel-compatible quoted names without trusting them",()=>{
  const template=recruiterSelectionCsvTemplate([{id:a,name:"=SUM(1,1)"},{id:b,name:"Doe, Jane"}]);
  expect(template).toContain("'=SUM");
  const result=parseRecruiterSelectionCsv(template,new Set([a,b]));
  expect(result).toEqual({ok:true,ids:[a,b]});
 });
 it("rejects foreign and invalid application IDs, preserving existing selection",()=>{
  expect(parseRecruiterSelectionCsv("application_id,name\n"+b+",Someone",
   new Set([a])).ok).toBe(false);
  expect(parseRecruiterSelectionCsv("application_id\n../../../etc/passwd",
   new Set([a])).ok).toBe(false);
 });
 it("deduplicates while bounding rows and file size",()=>{
  expect(parseRecruiterSelectionCsv("application_id\n"+a+"\n"+a,new Set([a])))
   .toEqual({ok:true,ids:[a]});
  expect(parseRecruiterSelectionCsv("X".repeat(65537),new Set([a])).ok).toBe(false);
  expect(parseRecruiterSelectionCsv("name\n"+a,new Set([a])).ok).toBe(false);
 });
});
