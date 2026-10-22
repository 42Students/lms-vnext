import {describe,expect,it} from "vitest";
import {projectSummaryRefreshDecision} from "@/modules/projects/project-summary-refresh-model";

const baseline={
 incomingProjectId:"workspace-a",incomingVersion:"2026-10-22T12:05:00.000Z",
 baselineProjectId:"workspace-a",baselineVersion:"2026-10-22T12:00:00.000Z",
 dirty:true,selfSavedProjectId:null as string|null,selfSavedVersion:null as string|null,
};
describe("G2-7-011-028 workspace overview refresh",()=>{
 it("keeps an unsaved local draft on a concurrent change",()=>{
  expect(projectSummaryRefreshDecision(baseline)).toBe("KEEP_DIRTY");
 });
 it("reinitializes a successful local save from the authoritative version",()=>{
  expect(projectSummaryRefreshDecision({...baseline,selfSavedProjectId:"workspace-a",
    selfSavedVersion:baseline.incomingVersion}))
   .toBe("REINITIALIZE");
 });
 it("keeps dirty edits when another revision follows a previous acknowledged save",()=>{
  expect(projectSummaryRefreshDecision({...baseline,selfSavedProjectId:"workspace-a",
    selfSavedVersion:"2026-10-22T12:02:00.000Z"})).toBe("KEEP_DIRTY");
 });
 it("preserves existing form state when no version changed",()=>{
  expect(projectSummaryRefreshDecision({...baseline,incomingVersion:baseline.baselineVersion}))
   .toBe("UNCHANGED");
 });
 it("switches to a different selected workspace instead of leaking the old form",()=>{
  expect(projectSummaryRefreshDecision({...baseline,incomingProjectId:"workspace-b"}))
   .toBe("REINITIALIZE");
 });
});
