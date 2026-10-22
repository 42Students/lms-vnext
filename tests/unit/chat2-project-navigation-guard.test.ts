import {describe,expect,it} from "vitest";
import {canKeepProjectEditorMountedAcrossNavigation as keep} from "@/modules/projects/project-navigation-guard-model";
const project="https://lms.example/mentor/projects/project-123?tab=overview&owner=42";
describe("G2-17-031-002 and G2-11-029-034 navigation discard guard",()=>{
 it("retains mentor modals across tab-only navigation in the same project",()=>{
  expect(keep(project,"https://lms.example/mentor/projects/project-123?owner=42&tab=board")).toBe(true);
 });
 it("still guards changing the project or scope",()=>{
  expect(keep(project,"https://lms.example/mentor/projects/project-456?tab=board&owner=42")).toBe(false);
  expect(keep(project,"https://lms.example/mentor/projects/project-123?tab=board&owner=43")).toBe(false);
 });
 it("guards college project tab changes unless its own cache policy is declared",()=>{
  expect(keep("https://lms.example/college/projects/123?tab=overview",
   "https://lms.example/college/projects/123?tab=board")).toBe(false);
 });
 it("allows hash-only jumps without discarding drafts",()=>{
  expect(keep(project,project+"#details")).toBe(true);
 });
});
