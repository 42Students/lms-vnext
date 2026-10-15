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
 it("persists first release description through validation",()=>{expect(initialSuperAdminTemplateDraft({...base,releaseDescription:"  First release  "}).blueprint.releases[0].description).toBe("First release");expect(()=>initialSuperAdminTemplateDraft({...base,releaseDescription:"x".repeat(4001)})).toThrow();});
 it("persists sprint description and denies excess length",()=>{expect(initialSuperAdminTemplateDraft({...base,sprintDescription:"  Sprint plan  "}).blueprint.sprints[0].description).toBe("Sprint plan");expect(()=>initialSuperAdminTemplateDraft({...base,sprintDescription:"x".repeat(4001)})).toThrow();});
 it("adds task instructions to the first task without altering its key",()=>{const p=initialSuperAdminTemplateDraft({...base,taskDescription:"  Complete the integration  "});expect(p.blueprint.tasks[0].description).toBe("Complete the integration");expect(p.blueprint.tasks[0].key).toBe("task-1");expect(()=>initialSuperAdminTemplateDraft({...base,taskDescription:"x".repeat(4001)})).toThrow();});
 it("stores overview narrative and denies overlong text",()=>{expect(initialSuperAdminTemplateDraft({...base,overviewDescription:"  Project context  "}).blueprint.overview.description).toBe("Project context");expect(()=>initialSuperAdminTemplateDraft({...base,overviewDescription:"x".repeat(4001)})).toThrow();});
});
