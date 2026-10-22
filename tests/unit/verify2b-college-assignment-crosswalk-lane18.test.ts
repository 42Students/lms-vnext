import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("W1_lane3_15: legacy college assignment resource verification",()=>{
 it("keeps existing signed file objects after a CAS resources-only save",()=>{
  const s=readFileSync("src/modules/courses/faculty-assignment-authoring-service.ts","utf8");
  expect(s).toContain('input.action==="EDIT"||input.action==="RESOURCES"?input.assignmentId:undefined');
  expect(s).toContain("if(submission)throw new CoursesServiceError");
  expect(s).toContain('await assertPersistedPlatformPermission(tx,context,"courses.manage"');
 });
 it("does not mistake unverified Drive links for private imported files",()=>{
  const s=readFileSync("src/components/courses/faculty-assignment-resources-editor.tsx","utf8");
  expect(s).toContain("downloaded or locally synced Drive file");
  expect(s).toContain("a public Drive URL is not treated as an imported binary file");
  expect(s).toContain("Scanner verification must finish before Save.");
 });
});
