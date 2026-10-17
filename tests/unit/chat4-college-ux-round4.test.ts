import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/college/"+route+"/page.tsx"),"utf8");
describe("Chat-4 College UX round 4",()=>{
 it("UX-college-companies-01 protects action size or responsive width",()=>{
 const page=source("companies");
 expect(page).toContain("min-h-11");
 
 });
 it("UX-college-contacts-01 protects action size or responsive width",()=>{
 const page=source("contacts");
 expect(page).toContain("min-h-11");
 expect(page).toContain("min-w-0 space-y");
 });
 it("UX-college-contacts-membershipId-01 protects action size or responsive width",()=>{
 const page=source("contacts/[membershipId]");
 expect(page).toContain("min-h-11");
 
 });
 it("UX-college-course-progress-01 protects action size or responsive width",()=>{
 const page=source("course-progress");
 
 expect(page).toContain("min-w-0 space-y");
 });
 it("UX-college-courses-01 protects action size or responsive width",()=>{
 const page=source("courses");
 
 expect(page).toContain("min-w-0 space-y");
 });
});
