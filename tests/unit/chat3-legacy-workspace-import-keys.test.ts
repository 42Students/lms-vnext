import {describe,expect,it} from "vitest";
import {
 materializeLegacyWorkspaceKeys,mapLegacyWorkspaceLifecycle,projectLegacyTaskProvenance,
} from "@/modules/projects/legacy-workspace-import-model";

describe("legacy project crosswalk source preservation",()=>{
 it("keeps provisional _clientId links stable through rename and duplicate title",()=>{
  const result=materializeLegacyWorkspaceKeys([
   {title:"Renamed Kickoff",_clientId:"sprint-client-1",legacyKeyAliases:["Original Kickoff"]},
   {title:"Renamed Kickoff",_clientId:"sprint-client-2"},
  ],[
   {title:"Linked A",sprintKey:"sprint-client-1"},
   {title:"Linked B",sprintKey:"sprint-client-2"},
   {title:"Legacy name",sprintKey:"Original Kickoff"},
  ]);
  expect(result.readyToPersist).toBe(true);
  expect(result.sprints.map(row=>row.key)).toEqual(["renamed-kickoff","renamed-kickoff-2"]);
  expect(result.tasks.map(row=>row.sprintKey)).toEqual(["renamed-kickoff","renamed-kickoff-2","renamed-kickoff"]);
 });
 it("fails closed on ambiguous title and an orphan sprint",()=>{
  const result=materializeLegacyWorkspaceKeys([
   {title:"Kickoff",_clientId:"sprint-1"},{title:"Kickoff",_clientId:"sprint-2"},
  ],[{title:"A",sprintKey:"Kickoff"},{title:"B",sprintKey:"Missing"}]);
  expect(result.readyToPersist).toBe(false);
  expect(result.tasks[0].sprintKey).toBeNull();
  expect(result.unresolvedLinks.map(row=>row.reason)).toEqual(["AMBIGUOUS","MISSING"]);
 });
 it("protects explicitly saved keys before generating missing ones",()=>{
  const result=materializeLegacyWorkspaceKeys([
   {key:"kickoff",title:"Explicit"},{title:"Kickoff"},
  ],[{key:"fixed-task",title:"A",sprintKey:"kickoff"}]);
  expect(result.sprints.map(row=>row.key)).toEqual(["kickoff","kickoff-2"]);
  expect(()=>materializeLegacyWorkspaceKeys([
   {key:"same",title:"A"},{key:"same",title:"B"},
  ],[])).toThrow(/Duplicate/);
 });
 it("preserves workflow status independently of soft deletion and archiving",()=>{
  const blocked=mapLegacyWorkspaceLifecycle(" blocked ","2025-01-01T00:00:00Z");
  expect(blocked.status).toBe("ACTIVE");
  expect(blocked.isBlocked).toBe(true);
  expect(blocked.canRestoreDeleted).toBe(true);
  expect(blocked.isArchived).toBe(false);
  const ready=mapLegacyWorkspaceLifecycle("ready");
  expect(ready.status).toBe("PLANNED");
  expect(ready.isReady).toBe(true);
  const archived=mapLegacyWorkspaceLifecycle("archived");
  expect(archived.isArchived).toBe(true);
  expect(archived.canRestoreDeleted).toBe(false);
 });
 it("retains historical task fields without interpreting numeric actor IDs as membership IDs",()=>{
  const task=projectLegacyTaskProvenance({
   taskKey:"backend-api",dueLabel:"End of sprint",sprintKey:"sprint-2",
   sprintLabel:"Platform",status:"IN_REVIEW",priority:"HIGH",
   submittedBy:23,submittedAt:"2025-04-01T00:00:00",
   createdBy:23,createdByType:"FACULTY",
   carriedOverFromSprintKey:"sprint-1",submissionUrl:"https://example.com/repo",
   removedFromTemplate:true,version:5,
  });
  expect(task.creator).toEqual({
   legacyId:23,legacyType:"FACULTY",membershipId:null,attributionVerified:false,
  });
  expect(task.submission.byLegacyLearnerId).toBe(23);
  expect(task.carriedOverFromSprintKey).toBe("sprint-1");
  expect(task.removedFromTemplate).toBe(true);
 });
});
