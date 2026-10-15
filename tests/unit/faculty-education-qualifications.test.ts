import {describe,expect,it} from "vitest";
import {newFacultyEducation} from "@/modules/people/faculty-profile-row-factories";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
describe("Faculty education extended academic details",()=>{
 it("preserves qualification/exam/score values across section edits",()=>{
  const row={...newFacultyEducation(),institutionName:"University",
   educationType:"Postgraduate",qualifyingExam:"GATE",examRank:"350",score:"88.5"};
  const changed=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"education",value:[row],expectedVersion:0,
  });
  expect(changed.education[0]?.qualifyingExam).toBe("GATE");
  expect(changed.education[0]?.examRank).toBe("350");
  expect(changed.education[0]?.score).toBe("88.5");
 });
 it("rejects oversized qualification details",()=>{
  const row={...newFacultyEducation(),institutionName:"University",qualifyingExam:"X".repeat(101)};
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"education",value:[row],expectedVersion:0,
  })).toThrow();
 });
});
