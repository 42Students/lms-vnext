import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const file=(path:string)=>readFileSync("src/app/(authenticated)/teacher/"+path,"utf8");
describe("Faculty contacts tabs, timetable and back-link wording",()=>{
 it("sets the contacts page H1 from the exact legacy tab titles",()=>{
  const page=file("contacts/[contactsTab]/page.tsx");
  for(const label of ["All Contacts","Teachers","Students"]){
   expect(page).toContain('label: "'+label+'"');
  }
  expect(page).toContain('<PageHeader title="Contacts" />');
  expect(page).toContain("in {selected.label}");
  expect(page).not.toContain('eyebrow="Faculty"');
  expect(page).not.toContain("Public directory of active college names, roles");
 });
 it("uses Class Schedule and no invented calendar subtitle",()=>{
  const calendar=file("calendar/page.tsx");
  expect(calendar).toContain('<PageHeader title="Class Schedule" actions={<Link href="/teacher/live-classes"');
  expect(calendar).not.toContain('eyebrow="Faculty"');
 });
 it("retains the exact legacy Back to courses button text",()=>{
  for(const route of ["calendar/error.tsx","courses/[deliveryId]/assessment-health/page.tsx"]){
   expect(file(route)).toContain("Back to courses");
   expect(file(route)).not.toContain("Back to Courses");
  }
 });
});
