import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("chat-19 template sprint/task per-row errors",()=>{
 it("G2-5-029-028 identifies every empty required title",()=>{
  const source=readFileSync("src/components/projects/super-admin-template-plan-editor.tsx","utf8");
  expect(source).toContain("currentSection.forEach((row,index)=>");
  expect(source).toContain('titleIssues[props.section+":"+index]="Title required"');
  expect(source).toContain('titleIssues["releases:"+index]="Title required"');
  expect(source).toContain("setRowErrors(titleIssues)");
  expect(source).toContain("setTaskSearch(\"\");setTaskPage(");
 });
 it("preserves secondary schema issues on the same row",()=>{
  const source=readFileSync("src/components/projects/super-admin-template-plan-editor.tsx","utf8");
  expect(source).toContain('rowIssues[key]+=" · "+issue.message');
  expect(source).toContain('rowErrors["tasks:"+index]');
  expect(source).toContain('rowErrors["sprints:"+index]');
 });
});
