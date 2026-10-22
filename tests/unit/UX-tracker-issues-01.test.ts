import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-tracker-issues-01",()=>{
 it("preserves original wording, permissions and supported accessible UX",()=>{
  const code=source("src/app/(authenticated)/tracker/issues/page.tsx");
  expect(code).toContain("listBugTrackerIssuesForAdmin");
  expect(code).toContain("parseTrackerIssuesPageParams");
  expect(code).toContain("<EmptyState");
  expect(code).toContain('role="list" aria-label="Reported issues"');
  expect(code).toContain('<article key={issue.id} role="listitem"');
  expect(code).toContain("<ErrorState");
  expect(code).toContain("<TrackerIssuesFilterBar");
  expect(source("src/components/tracker/tracker-issues-filter-bar.tsx")).toContain('<Button type="submit"');
  expect(code).toContain("No matching issues.");
  expect(code).toContain("TrackerIssueSavedViews");
  expect(code).toContain("TrackerIssueBulkActions");
  expect(code).toContain("min-h-11");


 });
});
