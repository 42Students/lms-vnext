import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const workspace=()=>readFileSync("src/components/projects/project-workspace.tsx","utf8");
describe("chat-7 mentor overview evidence",()=>{
it("MEN-projects-meetings-18 author-entered definition-of-done and persona evidence",()=>{
const content=workspace();
expect(content).toContain("Completion conditions");
expect(content).toContain("Personas");
expect(content).toContain("authoredBrief.completionConditions");
});
it("MEN-projects-meetings-19 recorded project due, next action and blocker shortcut",()=>{
const content=workspace();
expect(content).toContain("Next step · Open the Board");
expect(content).toContain("Open blocked work");
expect(content).toContain("workspace.project.dueLabel");
});
it("MEN-projects-meetings-21 task lane visualization and final signoff rule",()=>{
const content=workspace();
expect(content).toContain("aria-label=\"Task completion donut\"");
expect(content).toContain("Submission also needs all");
expect(content).toContain("aria-label=\"Task lane progress\"");
});
it("MEN-projects-meetings-23 legacy overview and deliverables vocabulary",()=>{
const content=workspace();
expect(content).toContain("About this project");
expect(content).toContain("Deliverables");
expect(content).toContain("Final submission");
});
it("MEN-projects-meetings-24 team card with explainer and count",()=>{
const content=workspace();
expect(content).toContain("Project team");
expect(content).toContain("See who is assigned, what role they play");
expect(content).toContain("member(s)");
});
});
