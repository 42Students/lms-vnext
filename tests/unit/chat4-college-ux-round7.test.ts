import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/college/"+route+"/page.tsx"),"utf8");
describe("Chat-4 college UX round seven",()=>{
 it("UX-college-hiring-dashboard-01 supports accessible narrow-screen presentation",()=>{
 const page=source("hiring-dashboard");
 expect(page).toContain("min-w-0 space-y");
 
 });
 it("UX-college-lecture-halls-01 supports accessible narrow-screen presentation",()=>{
 const page=source("lecture-halls");
 expect(page).toContain("min-w-0 space-y");
 expect(page).toContain("min-h-11");
 });
 it("UX-college-lecture-halls-hallId-01 supports accessible narrow-screen presentation",()=>{
 const page=source("lecture-halls/[hallId]");
 expect(page).toContain("min-w-0 space-y");
 expect(page).toContain("min-h-11");
 });
 it("UX-college-lessons-01 supports accessible narrow-screen presentation",()=>{
 const page=source("lessons");
 expect(page).toContain("min-w-0 space-y");
 
 });
});
