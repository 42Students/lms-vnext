import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(file:string)=>readFileSync(file,"utf8");
describe("Chat 6 friendly fetch adoption",()=>{
 it("GR-04 chat-6 client mutations use guarded apiFetch without raw error codes",()=>{
  for(const file of [
   "src/components/college/college-person-edit-action.tsx",
   "src/components/placements/placement-employer-relationships.tsx",
   "src/components/placements/college-drive-archive-action.tsx",
   "src/components/courses/admin-course-actions.tsx",
  ]){
   const content=source(file);
   expect(content).toContain("apiFetch");
   expect(content).not.toMatch(/throw (?:new )?Error\([^\n]*(?:payload|body|result)\?\.error/);
  }
 });
 it("GR-32 chat-6 edit forms keep draft state and show shared conflict message",()=>{
  expect(source("src/components/college/college-person-edit-action.tsx")).toContain("setPerson(current=>");
  expect(source("src/components/placements/placement-employer-relationships.tsx")).toContain("setDrafts");
  expect(source("src/lib/friendly-error.ts")).toContain("This changed while you were working.");
 });
 it("GR-90 chat-6 inline fetch failures have alert semantics",()=>{
  expect(source("src/components/college/college-person-edit-action.tsx")).toContain('role="alert"');
  expect(source("src/components/placements/college-drive-archive-action.tsx")).toContain('role="alert"');
 });
});
