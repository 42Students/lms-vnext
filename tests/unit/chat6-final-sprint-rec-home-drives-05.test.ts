import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync("src/app/(authenticated)/hr/home/page.tsx","utf8");
describe("Final sprint recruiter first-run and all-clear",()=>{
 it("REC-home-drives-05 first-run and all-clear states preserve legacy three-step guide",()=>{
  expect(source).toContain("collegeJobs.length===0 && requestCount===0");
  const start=source.indexOf("Start with your first drive");
  const end=source.indexOf("Request your first drive",start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  expect((source.slice(start,end).match(/<li>/g)??[])).toHaveLength(3);
  expect(source).toContain("recruiterDriveDraftHref({collegeId:selectedId})");
  expect(source).toContain("You are all caught up");
  expect(source).toContain("New applicants, replies and decisions from the placement cell will show up here.");
 });
});
