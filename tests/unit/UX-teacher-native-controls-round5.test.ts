import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)",path,"page.tsx"),"utf8");
function assertNativeControls(route:string){
 const source=read(route);
 for(const match of source.matchAll(/<(input|select|textarea)\b[^>]*>/g)){
  if(/\btype="hidden"/.test(match[0]))continue;
  const classes=match[0].match(/className="([^"]+)"/)?.[1];
  if(!classes)continue;
  expect(classes, route+" native field must have 16px phone typography").toContain("text-base");
  expect(classes, route+" native field needs visible keyboard focus").toContain("focus-visible:outline-2");
 }
 for(const match of source.matchAll(/<Link\b[^>]*>/g)){
  const classes=match[0].match(/className="([^"]+)"/)?.[1];
  if(!classes)continue;
  expect(classes, route+" link needs visible keyboard focus").toContain("focus-visible:outline-2");
 }
}
describe("Faculty native control UX",()=>{
 it("UX-teacher-calendar-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/calendar"));
 it("UX-teacher-contacts-contactsTab-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/contacts/[contactsTab]"));
 it("UX-teacher-courses-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/courses"));
 it("UX-teacher-courses-deliveryId-assessment-health-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/courses/[deliveryId]/assessment-health"));
 it("UX-teacher-courses-deliveryId-discussion-history-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/courses/[deliveryId]/discussion-history"));
 it("UX-teacher-courses-deliveryId-gradebook-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/courses/[deliveryId]/gradebook"));
 it("UX-teacher-courses-deliveryId-reports-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/courses/[deliveryId]/reports"));
 it("UX-teacher-live-classes-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/live-classes"));
 it("UX-teacher-notifications-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/notifications"));
 it("UX-teacher-profile-teaching-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/profile/teaching"));
});
