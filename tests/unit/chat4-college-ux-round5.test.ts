import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/college/"+route+"/page.tsx"),"utf8");
describe("Chat-4 college UX round five",()=>{
 it("UX-college-departments-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("departments");
 expect(page).toContain("min-w-0 space-y");
 
 
 });
 it("UX-college-domains-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("domains");
 expect(page).toContain("min-w-0 space-y");
 
 
 });
 it("UX-college-electives-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("electives");
 expect(page).toContain("min-w-0 space-y");
 
 
 });
 it("UX-college-electives-slotId-allocate-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("electives/[slotId]/allocate");
 expect(page).toContain("min-w-0 space-y");
 expect(page).toContain("sticky top-0 z-10 bg-surface");
 expect(page).toContain("min-h-11");
 });
 it("UX-college-electives-slotId-offerings-offeringId-roster-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("electives/[slotId]/offerings/[offeringId]/roster");
 
 expect(page).toContain("sticky top-0 z-10 bg-surface");
 expect(page).toContain("min-h-11");
 });
 it("UX-college-faculty-assignment-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("faculty-assignment");
 expect(page).toContain("min-w-0 space-y");
 
 expect(page).toContain("min-h-11");
 });
});
