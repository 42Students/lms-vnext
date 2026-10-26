import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync("src/components/hr/hr-drive-draft-form.tsx","utf8");
describe("Recruiter Request Drive screenshot 03",()=>{
 it("uses the latest prototype four-section order",()=>{
  const headings=["1 · The role","2 · Pay","3 · Who can apply","4 · Rounds"];
  const offsets=headings.map(heading=>source.indexOf(heading));
  expect(offsets.every(index=>index>=0)).toBe(true);
  expect(offsets).toEqual([...offsets].sort((a,b)=>a-b));
 });
 it("preserves real validation, unsent draft and placement-cell-only review",()=>{
  for(const phrase of ["What happens next","Send for review","Save unsent draft",
    "hrDraftCompensationWarnings","the college shares their records"]){
   expect(source).toContain(phrase);
  }
  expect(source).toContain("Applicants appear after");
  expect(source).toContain("not guaranteed before the college confirms");
 });
});
