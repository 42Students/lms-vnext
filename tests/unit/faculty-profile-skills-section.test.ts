import {describe,expect,it} from "vitest";
import { emptyFacultyProfileDocument } from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
const id="d2455c65-fcc1-461b-a24b-97020f54c32f";
describe("Faculty self-profile skills lifecycle",()=>{
 it("adds, changes proficiency, and deletes by replacing the authorized section",()=>{
  const first=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"skills",value:[{id,skill:"Java",proficiency:"Intermediate"}],expectedVersion:0,
  });
  expect(first.skills[0]?.proficiency).toBe("Intermediate");
  const revised=updateFacultyProfileSection(first,{
   section:"skills",value:[{id,skill:"Java",proficiency:"Advanced"}],expectedVersion:1,
  });
  expect(revised.skills[0]?.proficiency).toBe("Advanced");
  expect(updateFacultyProfileSection(revised,{section:"skills",value:[],expectedVersion:2}).skills).toEqual([]);
 });
 it("rejects duplicate record IDs and empty skill titles",()=>{
  const skill={id,skill:"Java",proficiency:""};
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{section:"skills",value:[skill,skill],expectedVersion:0})).toThrow();
  expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{section:"skills",value:[{...skill,skill:""}],expectedVersion:0})).toThrow();
 });
});
