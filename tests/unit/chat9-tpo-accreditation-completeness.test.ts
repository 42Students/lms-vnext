import {describe,it,expect} from "vitest";
import {accreditationStudentCompleteness} from "../../src/modules/placements/tpo-accreditation-completeness";
import type {AccreditationStudentRow} from "../../src/modules/placements/tpo-accreditation-students-model";
const item=(id:string):AccreditationStudentRow=>({membershipId:id,name:"Example Student",rollNumber:"ENR-1",programme:"B.Tech",branch:"CSE",
 batch:"2099",employer:"Example Co",employerContact:null,packageInr:800000,offersHeld:1,offerStatus:"ACCEPTED",joining:null});
describe("NAAC preflight per-student completeness",()=>{
 it("TPO-calendar-reports-35 reports missing fields by student and by seven required fields",()=>{
  const complete=item("a"),incomplete={...item("b"),rollNumber:null,packageInr:null};
  const result=accreditationStudentCompleteness([complete,incomplete]);
  expect(result.total).toBe(2);
  expect(result.missingStudents).toBe(1);
  expect(result.fields).toHaveLength(7);
  expect(result.fields.find(x=>x.key==="rollNumber")?.missing).toBe(1);
  expect(result.fields.find(x=>x.key==="packageInr")?.missing).toBe(1);
 });
});