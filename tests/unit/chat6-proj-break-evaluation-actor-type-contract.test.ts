import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=()=>readFileSync("src/modules/projects/evaluation-service.ts","utf8");
describe("PROJ-BREAK-evaluation-actor-01 compile-safe reauthorization",()=>{
 it("requires evaluator role narrowing before authorizing inside the transaction",()=>{
  const code=source();
  const body=code.slice(code.indexOf("export async function createProjectEvaluation("));
  expect(body).toContain('if(evaluatorAccess!=="ADMIN"&&evaluatorAccess!=="MENTOR")');
  expect(body).toContain('throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED")');
  expect(body).toContain("await assertCurrentEvaluationActor(tx,context,{");
  expect(body).toContain("project:{id:scope.project.id}");
  expect(body).toContain("collegeId:scope.collegeId");
  expect(body).toContain("organizationId:scope.organizationId");
  expect(body).toContain("access:evaluatorAccess");
  expect(body).not.toContain("{...scope,access:evaluatorAccess}");
  expect(body.indexOf(".for(\"update\")")).toBeLessThan(body.indexOf("await assertCurrentEvaluationActor("));
 });
 it("keeps persisted Super Admin permission and mentor membership locks, never trusts role text alone",()=>{
  const code=source();
  const helper=code.slice(code.indexOf("async function assertCurrentEvaluationActor("),code.indexOf("function mapEvaluationConstraint("));
  expect(helper).toContain("assertPersistedPlatformPermission");
  expect(helper).toContain('"projects.manage"');
  expect(helper).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(helper).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(helper).toContain('eq(projectMembers.role,"MENTOR")');
  expect(helper).toContain('.for("share")');
 });
});
