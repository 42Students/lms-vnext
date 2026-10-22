import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/college/"+route+"/page.tsx"),"utf8");
describe("Chat-4 college UX round five",()=>{
 it("UX-college-departments-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("departments");
 expect(page).toContain("grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-12");
 
 
 });
 it("UX-college-domains-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("domains");
 expect(page).toContain("min-w-0 max-w-full overflow-x-clip");
 
 
 });
 it("UX-college-electives-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("electives");
 expect(page).toContain("min-w-0 space-y-4");
 
 
 });
 it("UX-college-electives-slotId-allocate-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("electives/[slotId]/allocate");
 expect(page).toContain("min-w-0");
 expect(page).toContain("<DataTable");
 expect(page).toContain("rows={students}");
 expect(page).toContain('<ScrollCue axis="y" label="Eligible students for allocation"');
 expect(page).toContain('caption="Eligible students for allocation"');
 expect(page).toContain("min-h-11");
 });
 it("UX-college-electives-slotId-offerings-offeringId-roster-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("electives/[slotId]/offerings/[offeringId]/roster");
 
 expect(page).toContain("<DataTable");
 expect(page).toContain('caption="Elective offering roster"');
 expect(page).toContain("rows={rosterRows}");
 const table=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
 expect(table).toContain("md:sticky md:top-0");
 expect(table).toContain('<ScrollCue axis="x"');
 expect(page).toContain("min-h-11");
 });
 it("UX-college-faculty-assignment-01 makes the layout or actions more readable on narrow screens",()=>{
 const page=source("faculty-assignment");
 expect(page).toContain("min-w-0");
 
 expect(page).toContain("min-h-11");
 });
});
