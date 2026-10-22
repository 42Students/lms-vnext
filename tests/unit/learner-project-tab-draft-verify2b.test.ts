import {describe,it,expect} from "vitest";
import {learnerProjectTabHref,learnerProjectTabSwitchAllowed}
 from "@/modules/projects/learner-project-tab-href-model";

describe("legacy learner project tab draft protection",()=>{
 it("retains a task editor within the same project",()=>{
  const query=new URLSearchParams({taskId:"task-one",page:"2"});
  expect(learnerProjectTabHref("p-1","tasks",query,"p-1"))
   .toContain("taskId=task-one");
 });
 it("never reuses another project's task/editor or cursor",()=>{
  const query=new URLSearchParams({taskId:"old-task",page:"9",before:"secret"});
  expect(learnerProjectTabHref("p-2","board",query,"p-1"))
   .toBe("/learn/projects/p-2?tab=board");
 });
 it("requires explicit discard confirmation on same-tab or project switch",()=>{
  expect(learnerProjectTabSwitchAllowed({currentProjectId:"old",
   targetProjectId:"new",dirty:true,confirmedDiscard:false})).toMatchObject({
    allowed:false,prompt:expect.stringContaining("switch projects"),
  });
  expect(learnerProjectTabSwitchAllowed({currentProjectId:"old",
   targetProjectId:"new",dirty:true,confirmedDiscard:true}).allowed).toBe(true);
 });
});
