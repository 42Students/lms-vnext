import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const source=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
describe("Mentor Sprint and Release timeline code wiring",()=>{
 const timeline=source("src/components/projects/mentor-prototype-project-summaries.tsx");
 const editor=source("src/components/projects/mentor-release-editor.tsx");
 it("shows contextual creation only for active writable workspaces",()=>{
  expect(timeline).toContain('!readOnly&&workspace.project.status==="ACTIVE"');
  expect(timeline).toContain("<MentorReleaseEditor");
  expect(timeline).toContain("<MentorSprintCreate");
  expect(timeline).toContain('release.status!=="SHIPPED"');
 });
 it("does not duplicate the release ship action when editing inline",()=>{
  expect(timeline).toContain("hideShippingControl");
  expect(editor).toContain("!hideShippingControl&&release.status");
 });
 it("passes a real release ID and available non-shipped releases to sprint creation",()=>{
  expect(timeline).toContain("releaseId={release.id}");
  expect(timeline).toContain("releases={workspace.releases.map");
 });
 it("still gates actual mutations through per-entity expected update versions",()=>{
  expect(editor).toContain("expectedUpdatedAt:new Date(release.updatedAt).toISOString()");
  const sprint=source("src/components/projects/mentor-sprint-write.tsx");
  expect(sprint).toContain('"/sprints","POST"');
  expect(sprint).toContain("chosenRelease?.status===\"SHIPPED\"");
 });
});
