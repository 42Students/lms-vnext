import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");

describe("chat-15 final sprint Super Admin Projects verified closure",()=>{
 it("SA-placements-projects-91 allows admin sprint/task authoring while preserving read-only denial",()=>{
  const workspace=read("src/components/projects/project-workspace.tsx");
  expect(workspace).toContain('mode!=="LEARNER"&&!readOnly?<MentorSprintCreate');
  expect(workspace).toContain("<MentorSprintDetailsEdit");
  expect(workspace).toContain("<MentorSprintDeleteControl");
  expect(workspace).toContain("<MentorTaskDetailsEdit");
  expect(workspace).toContain("<ProjectTaskAssigneeControl");
  expect(workspace).toContain('mode === "ADMIN" && !readOnly');
  expect(workspace).toContain("<ProjectAdminSubmissionReview");
  expect(workspace).toContain("release.status !== \"SHIPPED\"");
  const access=read("src/modules/projects/access.ts");
  expect(access).toContain('scope.access !== "ADMIN" &&');
  expect(access).toContain('scope.access !== "MENTOR"');
  expect(access).toContain("requireProjectLifecycleMutationAccess");
 });
});
