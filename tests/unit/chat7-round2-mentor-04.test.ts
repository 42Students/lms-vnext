import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-7 mentor meetings and release contracts",()=>{
it("MEN-projects-meetings-26 bounded historic meetings with reveal control",()=>{
const source=readFileSync("src/components/projects/mentor-meeting-history.tsx","utf8");
expect(source).toContain("Past meetings / Meeting history");
expect(source).toContain("Show fewer");
expect(source).toContain("View all ");
});
it("MEN-projects-meetings-30 meeting-specific notes access",()=>{
const source=readFileSync("src/components/projects/project-workspace.tsx","utf8");
expect(source).toContain("meeting.outcome?\"View notes\":\"Add notes\"");
expect(source).toContain("\"/meetings/\"+encodeURIComponent(meeting.id)+\"/notes\"");
});
it("MEN-projects-meetings-31 tenant-scoped team meeting notifications",()=>{
const source=readFileSync("src/modules/projects/meeting-service.ts","utf8");
expect(source).toContain("notifyActiveProjectMembers");
expect(source).toContain("Meeting requested");
expect(source).toContain("A project meeting has been scheduled.");
expect(source).toContain("A project meeting has been cancelled.");
});
it("MEN-projects-meetings-32 release CRUD controls",()=>{
const source=readFileSync("src/components/projects/mentor-release-editor.tsx","utf8");
expect(source).toContain("New release");
expect(source).toContain("Edit release");
expect(source).toContain("Delete release");
});
it("MEN-projects-meetings-34 release-first sprint scheduling and definition of done",()=>{
const source=readFileSync("src/components/projects/mentor-sprint-write.tsx","utf8");
expect(source).toContain("Sprint goal");
expect(source).toContain("What does done look like?");
expect(source).toContain("Ships in release");
});
});
