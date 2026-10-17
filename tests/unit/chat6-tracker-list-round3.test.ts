import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {parseTrackerIssuesPageParams} from "../../src/modules/bug-tracker/issues-query-model";
const code=(p:string)=>readFileSync(p,"utf8");
describe("Tracker issues list legacy parity",()=>{
 it("SA-placements-projects-105 filters reporter by literal substring with pagination and legacy labels",()=>{
  const parsed=parseTrackerIssuesPageParams({reporter:"  Ann  ",sort:"newest",q:"validation"});
  expect(parsed?.display.reporter).toBe("Ann");
  expect(parsed?.display.q).toBe("validation");
  const page=code("src/app/(authenticated)/tracker/issues/page.tsx");
  for(const word of ['name="reporter"','next.set("reporter", current.reporter)',"Newest first",
    "Oldest first","No matching issues.","Search ID, description or page","issue.screen,issue.section"])
    expect(page).toContain(word);
  const service=code("src/modules/bug-tracker/admin-service.ts");
  expect(service).toContain("if(input.reporter)");
  expect(service).toContain("lower(${db10BugReports.reporterName})");
  expect(parseTrackerIssuesPageParams({reporter:"x".repeat(101)})).toBeNull();
 });
});
