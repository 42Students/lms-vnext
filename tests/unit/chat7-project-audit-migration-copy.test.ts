import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Projects audit notice follows migrated 0090 and 0091 reality",()=>{
 it("does not show obsolete DB07 staged-only notice on an authenticated project workspace",()=>{
  const src=readFileSync("src/components/projects/project-workspace.tsx","utf8");
  expect(src).not.toContain("Those DB07 tables remain staged");
  expect(src).not.toContain("W01 registers and replays");
  expect(src).toContain('activeSection === "audit"');
 });
});
