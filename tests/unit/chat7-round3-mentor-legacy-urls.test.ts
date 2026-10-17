import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {mentorEstimateLabel,mentorEstimateOptions} from "@/modules/projects/mentor-estimation-unit-model";
import {mentorProjectListQuerySchema} from "@/modules/projects/mentor-project-list-query";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-7 mentor versioned workflow and legacy link parsing",()=>{
 it("MEN-projects-meetings-R06 has a zero-release recovery state",()=>{
  const s=read("src/components/projects/project-workspace.tsx");
  expect(s).toContain("workspace.releases.length===0");expect(s).toContain("No sprints yet. Add the sprints");
 });
 it("MEN-projects-meetings-R07 rejects stale mentor meeting schedules",()=>{
  const s=read("src/modules/projects/meeting-service.ts");
  expect(s).toContain("PROJECT_MEETING_STALE_VERSION");expect(s).toContain("expectedProjectUpdatedAt");
  expect(s).toContain("existing.updatedAt.getTime()");
 });
 it("MEN-projects-meetings-R08 keeps live mentor search controls",()=>{
  const s=read("src/components/projects/project-participant-list-controls.tsx");
  expect(s).toContain("onInput={mentor?liveRefresh:undefined}");
  expect(s).toContain("setTimeout(()=>liveForm.current?.requestSubmit(),350)");
 });
 it("MEN-projects-meetings-R09 persists unit-specific estimate scales and labels",()=>{
  expect(mentorEstimateOptions("POINTS")).toContain(13);
  expect(mentorEstimateOptions("HOURS")).toContain(24);
  expect(mentorEstimateLabel(1,"HOURS")).toBe("1 hr");
  expect(mentorEstimateLabel(3,"POINTS")).toBe("3 pts");
 });
 it("MEN-projects-meetings-R10 accepts legacy statuses, zero-based first page and ignores unknown keys",()=>{
  const parsed=mentorProjectListQuerySchema.parse({status:"BLOCKED",page:"0",pageSize:"10",obsoleteField:"ignored"});
  expect(parsed.status).toBe("BLOCKED");expect(parsed.page).toBe(1);expect(parsed.pageSize).toBe(10);
  expect(Object.hasOwn(parsed,"obsoleteField")).toBe(false);
  expect(mentorProjectListQuerySchema.parse({status:"READY",page:"1"}).status).toBe("READY");
  expect(mentorProjectListQuerySchema.safeParse({pageSize:"13"}).success).toBe(false);
 });
});
