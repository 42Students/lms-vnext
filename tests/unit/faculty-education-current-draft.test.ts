import {describe,expect,it} from "vitest";
import {facultyEducationFieldEdit} from "@/modules/people/faculty-education-editor-model";
import {newFacultyEducation} from "@/modules/people/faculty-profile-row-factories";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
describe("Faculty current education editor",()=>{
 it("automatically clears graduation year when study is ongoing",()=>{
  const row={...newFacultyEducation(),institutionName:"College",startYear:"2023",endYear:"2026"};
  const next={...row,...facultyEducationFieldEdit(row,"isCurrentlyPursuing",true)};
  expect(next.endYear).toBe("");
  expect(updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"education",value:[next],expectedVersion:0,
  }).education[0]?.isCurrentlyPursuing).toBe(true);
 });
 it("never alters stored certificate references or unrelated fields",()=>{
  const row={...newFacultyEducation(),institutionName:"College",endYear:"2026",
   certificateDocumentId:"00000000-0000-4000-8000-000000000123"};
  const next={...row,...facultyEducationFieldEdit(row,"isCurrentlyPursuing",true)};
  expect(next.certificateDocumentId).toBe(row.certificateDocumentId);
  expect(next.institutionName).toBe("College");
 });
});
