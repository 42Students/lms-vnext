import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Mentor Projects module availability and friendly failures",()=>{
 it("MEN-projects-meetings-01 never mislabels access-policy lookup failure as Projects disabled",()=>{
  const component=src("src/components/projects/mentor-projects-unavailable.tsx");
  const page=src("src/app/(authenticated)/mentor/projects/page.tsx");
  expect(page).toContain("loadFailed={available===null}");
  expect(component).toContain("This does not mean Projects is disabled.");
  expect(component).toContain("Retry access check");
 });
 it("MEN-projects-meetings-08 retains notifications and retry when lookup fails",()=>{
  const landing=src("src/app/(authenticated)/mentor/page.tsx");
  const unavailable=src("src/components/projects/mentor-projects-unavailable.tsx");
  expect(landing).toContain("access===null");
  expect(landing).toContain("Retry access check");
  expect(unavailable).toContain("View notifications");
 });
});