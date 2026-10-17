import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/college/"+route+"/page.tsx"),"utf8");
describe("Chat-4 college UX round 2 source contracts",()=>{
 it("UX-college-assignments-01 prevents width overflow and preserves accessible controls",()=>{
 const page=source("assignments");
 expect(page).toContain("min-w-0 space-y");
 
 
 });
 it("UX-college-attendance-01 prevents width overflow and preserves accessible controls",()=>{
 const page=source("attendance");
 expect(page).toContain("min-w-0 space-y");
 expect(page).toContain("min-h-11");
 
 });
 it("UX-college-attendance-corrections-01 prevents width overflow and preserves accessible controls",()=>{
 const page=source("attendance/corrections");
 expect(page).toContain("min-w-0 space-y");
 
 expect(page).toContain("sticky top-0 z-10 bg-surface");
 });
 it("UX-college-attendance-departments-01 prevents width overflow and preserves accessible controls",()=>{
 const page=source("attendance/departments");
 expect(page).toContain("min-w-0 space-y");
 
 
 });
 it("UX-college-attendance-settings-01 prevents width overflow and preserves accessible controls",()=>{
 const page=source("attendance/settings");
 expect(page).toContain("min-w-0 space-y");
 expect(page).toContain("min-h-11");
 
 });
 it("UX-college-batch-promotion-01 prevents width overflow and preserves accessible controls",()=>{
 const page=source("batch-promotion");
 expect(page).toContain("min-w-0 space-y");
 
 
 });
});
