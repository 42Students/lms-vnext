import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("Final sprint legacy recruiter task links",()=>{
 it("REC-home-drives-10 legacy task deep links map onto authorized recruiter workspaces",()=>{
  const page=readFileSync("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx","utf8");
  expect(page).toContain('const safeTab=tab==="interviews"||tab==="results"?"rounds"');
  expect(page).toContain('tab==="selections"?"offers"');
  expect(page).toContain('tab==="messages"||tab==="requests"||tab==="discussion"?"overview"');
  expect(page).toContain("await getHrJobRead(context, jobId");
  expect(page).toContain('if(query.tab==="messages")redirect(hrDriveMessagesHref(workspace.job.id))');
  expect(page).toContain('const requestsTab=query.tab==="requests"');
  expect(page).toContain('const discussionTab=query.tab==="discussion"');
  expect(page).toContain('if(query.tab==="interviews"||query.tab==="results"||query.tab==="selections")');
  expect(page).toContain('notFound()');
 });
});
