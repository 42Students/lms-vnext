import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {mentorActivityCategory,mentorActivityLabel,mentorActivityRelativeTime} from "@/modules/projects/mentor-activity-display-model";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-11 mentor activity and resource parity",()=>{
 it("MEN-projects-meetings-54 offers mentor-only visibility and row tag",()=>{
  const form=source("src/components/projects/project-resource-controls.tsx");
  expect(form).toContain('value="MENTOR_ONLY"');
  expect(source("src/components/projects/project-workspace.tsx")).toContain('resource.visibility === "MENTOR_ONLY"');
 });
 it("MEN-projects-meetings-59 supports activity source and bounded date range filters",()=>{
  const ui=source("src/components/projects/project-activity-filtered-list.tsx");
  for(const piece of ["All activity","Date range","From date","To date","Clear filters"])expect(ui).toContain(piece);
  expect(ui).toContain("max={now.slice(0,10)}");
 });
 it("MEN-projects-meetings-61 humanizes activity type, category and empties",()=>{
  expect(mentorActivityLabel("PROJECT_TASK_UPDATED")).toBe("Task Updated");
  expect(mentorActivityCategory("PROJECT_TASK_UPDATED")).toBe("Task");
  expect(mentorActivityCategory("project.meeting.created")).toBe("Meeting");
  expect(source("src/components/projects/project-activity-filtered-list.tsx")).toContain("No project activity yet. Task moves");
 });
 it("MEN-projects-meetings-62 renders relative time with exact timestamp on hover",()=>{
  expect(mentorActivityRelativeTime("2099-01-01T00:00:00Z","2099-01-01T01:00:00Z")).toBe("1h ago");
  expect(mentorActivityRelativeTime("2099-01-01T00:00:00Z","2099-01-03T00:00:00Z")).toBe("2d ago");
  expect(source("src/components/projects/project-activity-filtered-list.tsx")).toContain("title={new Date(event.occurredAt).toLocaleString");
  expect(source("src/components/projects/project-workspace.tsx")).toContain("now={renderTime.toISOString()}");
 });
});
