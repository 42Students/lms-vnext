import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const code=()=>readFileSync(join(process.cwd(),"src/app/(authenticated)/mentor/notifications/page.tsx"),"utf8");
describe("mentor notification resilience",()=>{
 it("MEN-projects-meetings-71 preserves other sources and shows Retry sources when a feed fails",()=>{
  const source=code();
  expect(source).toContain("Promise.allSettled");
  expect(source).toContain('failedSources.push("Announcements")');
  expect(source).toContain('failedSources.push("Project attention")');
  expect(source).toContain('failedSources.push("Personal notifications")');
  expect(source).toContain("Some notification sources are unavailable");
  expect(source).toContain("Retry sources");
  expect(source).toContain("No project alerts are visible, but some notification sources could not be checked.");
 });
});
