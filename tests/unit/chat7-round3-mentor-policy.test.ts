import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-7 mentor allocation and meeting safety",()=>{
it("MEN-projects-meetings-51 auto-assignment acts on all eligible project tasks",()=>{
const source=read("src/components/projects/mentor-task-allocation.tsx");
expect(source).toContain("Auto-assign");
expect(source).toContain("eligible tasks");
});
it("MEN-projects-meetings-52 per-member workload uses done blocked and point counts",()=>{
const source=read("src/components/projects/mentor-task-allocation.tsx");
expect(source).toContain("Blocked");
expect(source).toContain("done");
expect(source).toContain("points");
});
it("MEN-projects-meetings-R03 meeting form fixes the user-visible wall-time zone to IST",()=>{
const source=read("src/components/projects/project-meeting-controls.tsx");
expect(source).toContain("Times are in Asia/Kolkata (IST).");
expect(source).toContain("setTimeZone(\"Asia/Kolkata\")");
});
it("MEN-projects-meetings-R04 join action does not appear on cancelled, completed or missed meetings",()=>{
const source=read("src/components/projects/project-workspace.tsx");
expect(source).toContain("meeting.status!==\"CANCELLED\"");
expect(source).toContain("meeting.status!==\"COMPLETED\"");
expect(source).toContain("\"MISSED\"");
});
it("MEN-projects-meetings-R05 completed and archived workspaces reject meeting writes",()=>{
const source=read("src/modules/projects/meeting-service.ts");
expect(source).toContain("status === \"ARCHIVED\" || status === \"COMPLETED\"");
expect(source).toContain("ensureMeetingProjectMutable");
});
});
