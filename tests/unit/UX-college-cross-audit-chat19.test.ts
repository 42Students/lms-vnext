import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const page=(route:string)=>readFileSync(join(process.cwd(),
  "src/app/(authenticated)/college/"+(route?route+"/":"")+"page.tsx"),"utf8");
const action=()=>readFileSync(join(process.cwd(),
  "src/components/placements/college-interview-status-actions.tsx"),"utf8");

describe("College cross-audit fixes (independent chat-19)",()=>{
 const focusRoutes=[
  "people/manage","placements","placements/drives","placements/interviews",
  "placements/jobs/[jobId]/applications","placements/jobs/[jobId]/interviews",
  "placements/jobs/[jobId]/shortlisted","placements/retention",
  "placements/student-lookup","projects","projects/templates","students/[membershipId]",
 ];
 for(const route of focusRoutes){
  it("COL-XA-01 "+route+" exposes keyboard focus and contrast-safe link text",()=>{
   const source=page(route);
   expect(source,route).toContain("focus-visible:outline-2");
   expect(source,route).not.toContain("text-primary-text");
   if(route!=="placements"&&route!=="students/[membershipId]"){
    expect(source,route).toContain("text-[var(--lms-teal-deep)]");
   }
  });
 }
 it("COL-XA-02 fixes nested main landmarks in activity and projects",()=>{
  for(const route of ["activity","projects"]){
   const source=page(route);
   expect(source,route).not.toMatch(/<main\b|<\/main>/);
   expect(source,route).toContain("PageHeader");
  }
 });
 const tables=[
  "","activity","attendance/corrections","batch-promotion",
  "batches/[cohortId]/students","electives/[slotId]/allocate",
  "electives/[slotId]/offerings/[offeringId]/roster",
  "faculty-assignment","faculty/[membershipId]",
 ];
 for(const route of tables){
  it("COL-XA-03 "+(route||"index")+" retains a scrollable sticky identity column",()=>{
   const source=page(route);
   expect(source,route).toContain("[&_th:first-child]:sticky");
   expect(source,route).toContain("[&_td:first-child]:sticky");
   expect(source,route).toMatch(/overflow-(?:x-auto|auto)/);
   expect(source,route).toContain("<table");
  });
 }
 const inputRoutes=[
  "activity","attendance/corrections","batch-promotion",
  "batches/[cohortId]/students","companies","contacts",
  "electives/[slotId]/allocate","electives/[slotId]/offerings/[offeringId]/roster",
  "faculty-assignment","people/manage","placements/drives",
  "placements/interviews","placements/jobs/[jobId]/applications",
  "placements/jobs/[jobId]/interviews","placements/jobs/[jobId]/shortlisted",
  "placements/student-lookup","students/[membershipId]",
 ];
 for(const route of inputRoutes){
  it("COL-XA-04 "+route+" prevents iOS small-input zoom",()=>{
   expect(page(route),route).toContain("text-base sm:text-sm");
  });
 }
 it("COL-XA-05 replaces interview window prompts with a named modal and retained reason",()=>{
  const s=action();
  expect(s).not.toMatch(/window\.(?:confirm|prompt)/);
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain("<Textarea");
  expect(s).toContain("Mark as Completed");
  expect(s).toContain("No Show");
  expect(s).toContain("Mark this interview as ");
  expect(s).toContain("Reason for interview ");
  expect(s).toContain("onBlur");
  expect(s).toContain("expectedVersion:version");
  expect(s).toContain("reason:trimmed");
  expect(s).toContain("if(!next||busy||status!==\"SCHEDULED\")return");
 });
 it("COL-XA-05 shared modal retains keyboard/escape and safe-area contracts",()=>{
  const dialog=readFileSync(join(process.cwd(),"src/components/ui/dialog.tsx"),"utf8");
  const confirm=readFileSync(join(process.cwd(),"src/components/ui/confirm-dialog.tsx"),"utf8");
  expect(dialog).toContain("modal.showModal()");
  expect(dialog).toContain("onCancel=");
  expect(dialog).toContain("opener.current?.focus()");
  expect(dialog).toContain("safe-area-inset-bottom");
  expect(confirm).toContain("dismissible={!pending}");
 });
});
