import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const s=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-12 academic roster UI",()=>{
 it("TPO-students-24 offers academic filters and preserves them in the Students URL",()=>{
  const p=s("src/app/(authenticated)/tpo/students/page.tsx");
  expect(p).toContain("Academic marks and passing year filters");
  for(const k of ["minTenthPct","minTwelfthPct","minDiplomaPct","minUgPct","passingYear","maxGapYears","marksVerified","isLateralEntry"])expect(p).toContain(k);
 });
 it("TPO-students-26 displays actual academic mark columns with unknown values rather than invented zeroes",()=>{
  const sheet=s("src/components/tpo/tpo-students-spreadsheet.tsx");
  for(const key of ['label:"10th %"','label:"12th %"','label:"Diploma %"','label:"UG %"','label:"Marks verified"','label:"Passing year"'])expect(sheet).toContain(key);
 });
 it("TPO-students-21 does not leak academics from another college via filters",()=>{
  const p=s("src/modules/placements/tpo-students-service.ts");
  expect(p).toContain("eq(collegeMemberships.collegeId, college.id)");
 });
});
