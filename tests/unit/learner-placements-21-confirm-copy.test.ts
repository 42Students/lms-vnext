import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("LEARNER-placements-21 application confirmation copy",()=>{
 it("LEARNER-placements-21 exposes consent disclosure and exact confirm/not-yet actions",()=>{
  const source=readFileSync(new URL("../../src/components/placements/learner-placement-jobs.tsx",import.meta.url),"utf8");
  for(const text of ["Ready to apply?","What exactly gets shared?","Hide what gets shared","Confirm & apply","Not yet"]){
   expect(source).toContain(text);
  }
  expect(source).toContain("No resume is attached by this form.");
 });
});