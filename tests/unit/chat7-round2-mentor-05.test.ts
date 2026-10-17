import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-7 sprint and board feature contracts",()=>{
it("MEN-projects-meetings-35 sprint deletion warns about returning tasks to backlog",()=>{
 const source=readFileSync("src/components/projects/mentor-sprint-delete-control.tsx","utf8");
 expect(source).toContain("product backlog");
 expect(source).toContain("task(s) will return");
});
it("MEN-projects-meetings-36 backlog and sprint-pull actions with velocity",()=>{
 const source=readFileSync("src/components/projects/mentor-product-backlog.tsx","utf8");
 expect(source).toContain("Product backlog");
 expect(source).toContain("Pull task into selected sprint?");
 expect(source).toContain("Velocity");
});
it("MEN-projects-meetings-37 release shipment and reversal confirmations",()=>{
 const source=readFileSync("src/components/projects/project-lifecycle-actions.tsx","utf8");
 expect(source).toContain("Ship this release?");
 expect(source).toContain("Un-ship this release?");
});
it("MEN-projects-meetings-39 task board includes backlog and status lanes",()=>{
 const source=readFileSync("src/components/projects/mentor-lane-board.tsx","utf8");
 expect(source).toContain("Backlog");
 expect(source).toContain("IN_PROGRESS");
 expect(source).toContain("BLOCKED");
});
it("MEN-projects-meetings-40 board filters expose clear-all and priority/member state",()=>{
 const source=readFileSync("src/components/projects/mentor-lane-board.tsx","utf8");
 expect(source).toContain("Clear all");
 expect(source).toContain("priority");
 expect(source).toContain("assignee");
});
});
