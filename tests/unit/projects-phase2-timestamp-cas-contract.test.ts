import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const code=(file:string)=>readFileSync(new URL("../../src/modules/projects/"+file,import.meta.url),"utf8");
const targets=[
  ["task-assignment-service.ts","projectTasks.updatedAt"],
  ["lifecycle-service.ts","projectTasks.updatedAt"],
  ["instance-restore-service.ts","projectInstances.updatedAt"],
] as const;
describe("PR-S2-03/PR-S2-10/PR-S2-14 PostgreSQL microsecond timestamp CAS",()=>{
  it.each(targets)("%s compares the client millisecond token in PostgreSQL", (file,column)=>{
    const source=code(file);
    expect(source).toContain("date_trunc('milliseconds', ${"+column+"})");
    expect(source).toContain("new Date(input.expectedUpdatedAt).toISOString()");
    expect(source).not.toContain("eq("+column+",");
  });
  it("keeps task mutation under a row lock and a scoped optimistic predicate",()=>{
    for(const file of ["task-assignment-service.ts","lifecycle-service.ts"]){
      expect(code(file)).toContain('.for("update")');
      expect(code(file)).toContain("projectTasks.projectId");
      expect(code(file)).toContain("PROJECT_TASK_INVALID_STATE");
    }
    expect(code("instance-restore-service.ts")).toContain('eq(projectInstances.status,"ARCHIVED")');
  });
});
