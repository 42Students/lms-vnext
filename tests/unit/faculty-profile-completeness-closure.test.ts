import {describe,expect,it} from "vitest";
import {emptyFacultyProfileDocument,facultyProfileDocumentSchema} from "@/modules/people/faculty-profile-document";
import {facultyProfileCompleteness} from "@/modules/people/faculty-profile-completeness-model";
describe("Faculty profile completeness after safe section edits",()=>{
 it("starts at zero and never treats college-managed title or login data as required self sections",()=>{
  expect(facultyProfileCompleteness(emptyFacultyProfileDocument))
   .toEqual({completed:0,total:13,percent:0});
 });
 it("returns the same deterministic progress after persisted data is reloaded",()=>{
  const document=facultyProfileDocumentSchema.parse({
   about:{description:"Faculty mentor"},
   contact:{contactMobile:"9876543210"},
   skills:[{id:"55555555-5555-4555-8555-555555555555",skill:"Pedagogy",proficiency:"Advanced"}],
  });
  expect(facultyProfileCompleteness(document)).toMatchObject({completed:3,total:13,percent:23});
  expect(facultyProfileCompleteness(facultyProfileDocumentSchema.parse(JSON.parse(JSON.stringify(document)))))
   .toEqual(facultyProfileCompleteness(document));
 });
 it("counts each editable profile section only once",()=>{
  const document=facultyProfileDocumentSchema.parse({
   about:{description:"About"},
   personalDetails:{dateOfBirth:"1990-01-01"},
   contact:{contactMobile:"9876543210",contactMail:"test@example.com"},
   address:{currentAddress:"Home"},
   socialProfiles:{linkedIn:"https://example.com"},
   experiences:[{id:"55555555-5555-4555-8555-555555555555",organization:"University"}],
   education:[{id:"66666666-6666-4666-8666-666666666666",institutionName:"School"}],
   skills:[{id:"77777777-7777-4777-8777-777777777777",skill:"Teaching"}],
   certifications:[{id:"88888888-8888-4888-8888-888888888888",name:"Certificate"}],
   languages:[{id:"99999999-9999-4999-8999-999999999999",language:"Telugu"}],
   publications:[{id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",title:"Paper"}],
   awards:[{id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",title:"Award"}],
   metadata:{officeHours:"Tuesday"},
  });
  expect(facultyProfileCompleteness(document)).toEqual({completed:13,total:13,percent:100});
 });
});
