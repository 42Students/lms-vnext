import { describe,expect,it } from "vitest";
import { emptyFacultyProfileDocument } from "@/modules/people/faculty-profile-document";
import { updateFacultyProfileSection } from "@/modules/people/faculty-self-section-model";
describe("Faculty editable profile section", () => {
 it("updates about without losing independent sections", () => {
  const updated=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"about",value:{description:"Teaches mathematics"},expectedVersion:0,
  });
  expect(updated.about.description).toBe("Teaches mathematics");
  expect(updated.skills).toEqual([]);
 });
 it("refuses contact credentials, malformed sections and injected fields", () => {
  for (const section of ["contact","identitySummary","employmentType"]) {
   expect(() => updateFacultyProfileSection(emptyFacultyProfileDocument,{section,value:{},expectedVersion:0})).toThrow();
  }
  expect(() => updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"about",value:{description:"Hello",isAdmin:true},expectedVersion:0,
  })).toThrow();
 });
});
