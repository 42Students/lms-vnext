import {describe,it,expect} from "vitest";
import {initialSuperAdminTemplateDraft} from "@/modules/projects/super-admin-template-create-model";
describe("Super Admin template creation",()=>{
 const base={slug:" campus-project ",title:"Campus Project",summary:"",goal:"",release:"Release 1",sprint:"Sprint 1",task:"First task"};
 it("builds a valid connected version-one blueprint",()=>{
  const result=initialSuperAdminTemplateDraft(base);
  expect(result.slug).toBe("campus-project");
  expect(result.blueprint.tasks[0].sprintKey).toBe(result.blueprint.sprints[0].key);
  expect(result.blueprint.sprints[0].releaseKey).toBe(result.blueprint.releases[0].key);
 });
 it("rejects malformed IDs, titles and missing task",()=>{
  expect(()=>initialSuperAdminTemplateDraft({...base,slug:"bad domain"})).toThrow();
  expect(()=>initialSuperAdminTemplateDraft({...base,task:""})).toThrow();
 });
 it("persists user-selected initial task priority and rejects unknown priority",()=>{expect(initialSuperAdminTemplateDraft({...base,priority:"HIGH"}).blueprint.tasks[0].priority).toBe("HIGH");expect(()=>initialSuperAdminTemplateDraft({...base,priority:"UNSAFE"})).toThrow();});
 it("saves trimmed task acceptance criteria and rejects oversized criteria",()=>{expect(initialSuperAdminTemplateDraft({...base,acceptanceCriteria:"  Test evidence  "}).blueprint.tasks[0].acceptanceCriteria).toBe("Test evidence");expect(()=>initialSuperAdminTemplateDraft({...base,acceptanceCriteria:"x".repeat(4001)})).toThrow();});
});
