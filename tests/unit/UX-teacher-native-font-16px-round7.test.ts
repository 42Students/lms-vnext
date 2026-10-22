import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const read=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)",route,"page.tsx"),"utf8");
const readControl=(name:"input"|"select"|"textarea")=>
 readFileSync(join(process.cwd(),"src/components/ui",name+".tsx"),"utf8");

/** The legacy app uses 14px inputs at desktop widths and 16px native fields on
 * phones to prevent automatic browser zoom. Routes now delegate most filters
 * to shared controls; assert the contract at the component that paints them. */
describe("Faculty native controls preserve readable mobile fonts",()=>{
 const routes=[
  ["UX-teacher-calendar-03","teacher/calendar"],
  ["UX-teacher-contacts-contactsTab-03","teacher/contacts/[contactsTab]"],
  ["UX-teacher-courses-deliveryId-assessment-health-03","teacher/courses/[deliveryId]/assessment-health"],
  ["UX-teacher-courses-deliveryId-discussion-history-03","teacher/courses/[deliveryId]/discussion-history"],
  ["UX-teacher-courses-deliveryId-gradebook-03","teacher/courses/[deliveryId]/gradebook"],
  ["UX-teacher-courses-deliveryId-reports-03","teacher/courses/[deliveryId]/reports"],
  ["UX-teacher-live-classes-03","teacher/live-classes"],
  ["UX-teacher-profile-teaching-03","teacher/profile/teaching"],
 ] as const;
 for(const [id,route] of routes){
  it(`${id} keeps accessible shared field typography across breakpoints`,()=>{
   const source=read(route);
   expect(source).not.toMatch(/<(?:input|select|textarea)\b(?![^>]*type="hidden")/);
   for(const control of ["input","select","textarea"] as const){
    const component=readControl(control);
    expect(component).toContain("text-[var(--lms-font-base)]");
    expect(component).not.toMatch(/\bsm:text-(?:xs|sm)\b/);
   }
   expect(readControl("select")).toContain("max-[767px]:text-[16px]");
   expect(readControl("input")).toContain("max-[767px]:min-h-11");
  });
 }
});
