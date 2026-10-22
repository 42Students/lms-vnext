import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/college/"+route+"/page.tsx"),"utf8");
describe("Chat-4 College UX round six",()=>{
 it("UX-college-faculty-membershipId-01 keeps narrow-screen routes usable",()=>{
 const page=source("faculty/[membershipId]");
 expect(page).toMatch(/min-w-0 (?:max-w-full )?space-y/);
 expect(page).toMatch(/min-h-11|<PageBackLink/);
 });
 it("UX-college-faculty-import-01 keeps narrow-screen routes usable",()=>{
 const page=source("faculty/import");
 expect(page).toMatch(/min-w-0 (?:max-w-full )?space-y/);
 
 });
 it("UX-college-groups-01 keeps narrow-screen routes usable",()=>{
 const page=source("groups");
 expect(page).toMatch(/min-w-0 (?:max-w-full )?space-y/);
 
 });
 it("UX-college-groups-groupId-01 keeps narrow-screen routes usable",()=>{
 const page=source("groups/[groupId]");
 expect(page).toMatch(/min-w-0 (?:max-w-full )?space-y/);
 expect(page).toMatch(/min-h-11|<PageBackLink/);
 });
 it("UX-college-groups-groupId-import-preview-01 keeps narrow-screen routes usable",()=>{
 const page=source("groups/[groupId]/import-preview");
 expect(page).toMatch(/min-w-0 (?:max-w-full )?space-y/);
 expect(page).toMatch(/min-h-11|<PageBackLink/);
 });
 it("UX-college-groups-groupId-rule-preview-01 keeps narrow-screen routes usable",()=>{
 const page=source("groups/[groupId]/rule-preview");
 expect(page).toMatch(/min-w-0 (?:max-w-full )?space-y/);
 expect(page).toMatch(/min-h-11|<PageBackLink/);
 });
});
