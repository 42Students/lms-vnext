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
   // Links use semantic legacy-clone tokens rather than one hard-coded teal.
   expect(source,route).toMatch(/text-link|text-primary-text|text-\[var\(--lms-teal-deep\)\]/);
   expect(source,route).toContain("min-h-11");
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
  it("COL-XA-03 "+(route||"index")+" retains mobile identity cards and sticky desktop columns",()=>{
   const source=page(route);
   if(route===""){
    // A metric/attention dashboard must not fabricate a roster table.
    expect(source).toContain("<CollegeNeedsAttentionBoard");
    expect(source).toContain("<CollegeDashboardCards");
   }else if(route==="activity"){
    // Grouped historical activity is a chronological event list.
    expect(source).toContain("<ol");
    expect(source).toContain("collegeActivityHref");
   }else if(route==="electives/[slotId]/allocate"){
    // This route delegates the responsive table to its client-side selection component.
    expect(source).toContain("<ElectiveEligibleSelection");
    const selection=readFileSync(join(process.cwd(),"src/components/academics/elective-eligible-selection.tsx"),"utf8");
    expect(selection).toContain("<DataTable");
    expect(selection).toMatch(/mobilePriority:\s*["\x27]primary["\x27]/);
    expect(selection).not.toContain("<table");
   }else{
    expect(source,route).toContain("<DataTable");
    expect(source,route).toMatch(/mobilePriority:\\s*["']primary["']/);
    expect(source,route).not.toContain("<table");
   }
   const shared=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
   expect(shared).toContain('mobileMode = "scroll"');
   expect(shared).toContain("const visibleOnPhone");
   expect(shared).toContain("<Disclosure");
   expect(shared).toContain('<ScrollCue axis="x"');
   expect(shared).toContain("focus-visible:outline-2");
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
   const source=page(route);
   // 16px native iOS controls live in the shared input/select components.
   expect(source,route).toMatch(/<Input\b|<Select\b|<DateInput\b|<FilterBar\b/);
   const input=readFileSync(join(process.cwd(),"src/components/ui/input.tsx"),"utf8");
   const select=readFileSync(join(process.cwd(),"src/components/ui/select.tsx"),"utf8");
   expect(input).toContain("max-[767px]:min-h-11");
   expect(select).toContain("max-[767px]:text-[16px]");
   expect(input).toContain("focus-visible:outline-2");
   expect(select).toContain("focus-visible:outline-2");
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
  const exit=readFileSync(join(process.cwd(),"src/components/ui/use-overlay-exit.ts"),"utf8");
  expect(dialog).toContain("useOverlayExit(");
  expect(exit).toContain("dialog.showModal()");
  expect(exit).toContain("restoreFocus");
  expect(dialog).toContain("onCancel=");
  expect(dialog).toContain("opener.current.focus()");
  expect(exit).toContain("if (opener?.isConnected) opener.focus()");
  expect(dialog).toContain("safe-area-inset-bottom");
  expect(confirm).toContain("dismissible={!pending}");
 });
});

describe("College cross-audit component regressions",()=>{
 const college=(name:string)=>readFileSync(join(process.cwd(),
  "src/components/college/"+name+".tsx"),"utf8");
 const placements=(name:string)=>readFileSync(join(process.cwd(),
  "src/components/placements/"+name+".tsx"),"utf8");
 const confirmations=[
  "college-faculty-assignment-actions",
  "college-faculty-schedule-reassign",
  "college-offering-lifecycle-action",
  "college-offering-metadata-action",
  "college-person-edit-action",
  "college-student-register-form",
 ];
 for(const name of confirmations){
  it("COL-XA-06 "+name+" never invokes a native WebView confirmation",()=>{
   const s=college(name);
   expect(s).not.toMatch(/window\.(?:confirm|prompt|alert)/);
   expect(s).toContain("useCollegeConfirmation");
  });
 }
 for(const name of ["college-drive-duplicate-action","college-drive-deadline-action","college-drive-bulk-actions"]){
  it("COL-XA-06 "+name+" offers an in-app confirmation",()=>{
   const s=placements(name);
   expect(s).not.toMatch(/window\.(?:confirm|prompt|alert)/);
   if(name==="college-drive-deadline-action") {
    expect(s).toContain('title={"Extend deadline — "+title}');
    expect(s).toContain("<Dialog");
   }
   else if(name==="college-drive-duplicate-action") expect(s).toContain("useCollegeConfirmation");
   else expect(s).toContain("eligible drives?");
  });
 }
 const modals=[
  ["college","college-faculty-schedule-reassign"],
  ["college","college-offering-metadata-action"],
  ["college","college-person-edit-action"],
  ["college","college-person-audit-modal"],
  ["college","college-person-profile-overview-modal"],
  ["college","college-student-import-history"],
  ["college","college-faculty-reassign-action"],
  ["placements","college-drive-deadline-action"],
  ["placements","college-interview-appointments"],
  ["placements","college-application-pipeline-controls"],
  ["placements","college-application-detail-drawer"],
 ] as const;
 for(const [area,name] of modals){
  it("COL-XA-07 "+name+" uses shared accessible Dialog, not faux aria-modal",()=>{
   const s=area==="college"?college(name):placements(name);
   expect(s).toContain("<Dialog");
   expect(s).not.toMatch(/role="dialog"|aria-modal="true"/);
  });
 }
 it("COL-XA-08 WebView links do not open unhandled popup windows",()=>{
  for(const s of [college("college-admin-profile-editor"),
    placements("college-application-detail-drawer")]){
   expect(s).not.toContain('target="_blank"');
  }
 });
 for(const name of ["college-drive-attention-cards","college-application-detail-drawer",
  "college-drive-archive-action","college-drive-row-lifecycle-action"]){
  it("COL-XA-08 "+name+" uses 44px targets",()=>{
   const s=placements(name);
   expect(s).toContain("min-h-11");
   // The 36px desktop controls remain behind breakpoint variants only.
   expect(s).not.toMatch(/(?<!md:|sm:|lg:|min-\[768px\]:)min-h-(?:9|10)\b/);
  });
 }
 it("COL-XA-06 shared confirmation remains a real cancellable native dialog",()=>{
  const s=college("use-college-confirmation");
  expect(s).toContain("<ConfirmDialog");
  expect(s).toContain("new Promise<boolean>");
  expect(s).toContain("pending?.(answer)");
  expect(s).toContain("resolver.current?.(false)");
 });
});
