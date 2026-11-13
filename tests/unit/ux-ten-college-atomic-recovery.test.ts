import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const root="src/app/(authenticated)/college/";
const cases=[
  ["UX-G030","batch-promotion/error.tsx","Batch promotion","/college/batches"],
  ["UX-G031","companies/error.tsx","Companies","/college"],
  ["UX-G032","courses/offerings/[offeringId]/error.tsx","Course offering","/college/courses"],
  ["UX-G033","electives/[slotId]/offerings/[offeringId]/roster/error.tsx","Elective offering roster","/college/electives"],
  ["UX-G034","groups/[groupId]/import-preview/error.tsx","Group import preview","/college/groups"],
  ["UX-G035","lecture-halls/[hallId]/error.tsx","Lecture hall schedule","/college/lecture-halls"],
  ["UX-G037","placements/jobs/[jobId]/applications/error.tsx","Placement applications","/college/placements"],
  ["UX-G038","placements/readiness-by-department/error.tsx","Placement readiness by department","/college/placements"],
  ["UX-G039","projects/[projectId]/[section]/error.tsx","Project workspace","/college/projects"],
  ["UX-G040","projects/audit/error.tsx","Project audit","/college/projects"],
] as const;

describe("Ten atomic DOING College Admin UX recovery groups",()=>{
 for(const [id,path,title,href] of cases){
  it(id+" keeps route identity, action, safe exit and no private exception text",()=>{
   const code=readFileSync(root+path,"utf8");
   expect(code).toContain('<PageHeader title="'+title+'"');
   expect(code).toContain(href);
   expect(code).toContain("reset");
   expect(code).not.toContain("{error.message}");
   expect(code).not.toContain("{error.digest}");
  });
 }
 it("does not duplicate shared shell headers in project audit",()=>{
  const audit=readFileSync(root+"projects/audit/error.tsx","utf8");
  expect(audit).toContain("insideShell showHeader={false}");
 });
 it("keeps project-section retry a non-submitting, mobile full-width action",()=>{
  const project=readFileSync(root+"projects/[projectId]/[section]/error.tsx","utf8");
  expect(project).toContain('type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"');
  expect(project).toContain('href="/college/projects" className="w-full sm:w-auto"');
 });
 it("touch-size operational recovery, search and pagination links for active College Admin work",()=>{
  const promotion=readFileSync(root+"batch-promotion/page.tsx","utf8");
  expect(promotion).toContain('className="ml-2 inline-flex min-h-11 items-center md:min-h-9">Retry');
  expect(promotion).toContain('className="inline-flex min-h-11 items-center md:min-h-9">Previous');
  expect(promotion).toContain('className="inline-flex min-h-11 items-center md:min-h-9">Next');
  const companies=readFileSync(root+"companies/page.tsx","utf8");
  expect(companies).toContain('className="inline-flex min-h-11 items-center md:min-h-9 text-xs">Clear search');
 });
 it("atomic browser preview is included in the development-only fixture",()=>{
  const page=readFileSync("src/app/e2e/ux-ten-college-recovery/page.tsx","utf8");
  expect(page).toContain("UXTenCollegeAtomicRecoveryPreview");
  expect(page).toContain('process.env.NODE_ENV!=="development"');
  expect(page).toContain('env.UX_TEN_COLLEGE_FIXTURE!=="1"');
 });
});
