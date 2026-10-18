import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const route="/mentor/projects";
const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
describe("UX mentor /mentor/projects audit contract",()=>{
 it("UX-mentor-projects-01 reads the current membership and uses its authorized service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch("listMyProjectInstances"=== "" ? /\w+/ : /listMyProjectInstances\s*\(/);
 });
 it("UX-mentor-projects-02 preserves route copy and the actual recovery/workflow state",()=>{
  expect(src).toContain("title=\"Projects\"");
  expect(src).toContain("ProjectParticipantPagination");
 });
});
