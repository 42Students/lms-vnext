import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/college/"+route+"/page.tsx"),"utf8");
describe("Chat-4 college UX round 3",()=>{
 it("UX-college-batches-01 adds safe narrow-screen affordances",()=>{
 const page=source("batches");
 expect(page).toContain("min-w-0 space-y");
 
 });
 it("UX-college-batches-cohortId-students-01 adds safe narrow-screen affordances",()=>{
 const page=source("batches/[cohortId]/students");
 expect(page).toContain("sticky top-0 z-10 bg-surface");
 expect(page).toContain("min-h-11");
 
 });
 it("UX-college-branding-01 adds safe narrow-screen affordances",()=>{
 const page=source("branding");
 expect(page).toContain("min-w-0 space-y");
 
 });
 it("UX-college-classes-01 adds safe narrow-screen affordances",()=>{
 const page=source("classes");
 expect(page).toContain("min-w-0 space-y");
 expect(page).toContain("min-h-11");
 });
 it("UX-college-classes-recurring-preview-01 adds safe narrow-screen affordances",()=>{
 const page=source("classes/recurring-preview");
 expect(page).toContain("min-w-0 space-y");
 
 });
 it("UX-college-college-profile-01 adds safe narrow-screen affordances",()=>{
 const page=source("college-profile");
 expect(page).toContain("min-w-0 space-y");
 expect(page).toContain("min-h-11");
 });
});
