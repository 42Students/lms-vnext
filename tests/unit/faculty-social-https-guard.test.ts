import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
import {updateFacultyProfileSection} from "@/modules/people/faculty-self-section-model";
describe("Faculty changed public links use secure HTTPS",()=>{
 it("rejects plain HTTP and embedded credentials on new links",()=>{
  for(const github of ["http://example.com/a","https://name:password@example.com/a","https://localhost/a"]){
   expect(()=>updateFacultyProfileSection(emptyFacultyProfileDocument,{
    section:"socialProfiles",expectedVersion:0,
    value:{...emptyFacultyProfileDocument.socialProfiles,github}
   })).toThrow();
  }
 });
 it("permits ordinary HTTPS professional links",()=>{
  const x=updateFacultyProfileSection(emptyFacultyProfileDocument,{
   section:"socialProfiles",expectedVersion:0,
   value:{...emptyFacultyProfileDocument.socialProfiles,github:"https://github.com/teacher"}
  });
  expect(x.socialProfiles.github).toBe("https://github.com/teacher");
 });
});
