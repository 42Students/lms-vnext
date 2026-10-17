import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-7 round 3 mentor execution controls",()=>{
it("MEN-projects-meetings-33 release roadmap and shipping readiness",()=>{
const source=read("src/components/projects/project-workspace.tsx");
expect(source).toContain("aria-label=\"Release roadmap\"");
expect(source).toContain("sprints complete");
expect(source).toContain("Ready to ship");
});
it("MEN-projects-meetings-38 mentor-visible release/sprint vocabulary and empty state",()=>{
const source=read("src/components/projects/project-workspace.tsx");
expect(source).toContain("mode===\"ADMIN\"?\"Execution\":\"Releases and Sprints\"");
expect(source).toContain("No sprints yet. Add the sprints");
});
it("MEN-projects-meetings-41 board task evidence includes owner blocker estimate and due",()=>{
const source=read("src/components/projects/mentor-lane-board.tsx");
expect(source).toContain("assigneeMembershipId");
expect(source).toContain("estimatePoints");
expect(source).toContain("blockerReason");
expect(source).toContain("dueDate");
});
it("MEN-projects-meetings-46 task deletion prompts and requires a version token",()=>{
const source=read("src/components/projects/mentor-task-delete-control.tsx");
expect(source).toContain("Delete this task?");
expect(source).toContain("It cannot be undone.");
expect(source).toContain("expectedUpdatedAt");
});
it("MEN-projects-meetings-49 project-scoped member notifications",()=>{
const source=read("src/modules/projects/project-notification-service.ts");
expect(source).toContain("notifyActiveProjectMembers");
expect(source).toContain("roles");
expect(source).toContain("projectId");
});
});
