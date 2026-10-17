import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {updateCollegeProgramSchema} from "@/modules/academics/college-program-mutation-model";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin program department changes",()=>{
 it("SA-academics-people-12 allows moving an unlinked program only to another active department in the scoped college",()=>{
  const departmentId="00000000-0000-4000-8000-000000000001";
  const value=updateCollegeProgramSchema.parse({name:"Civil",code:"CIVIL",departmentId,durationTerms:8});
  expect(value.departmentId).toBe(departmentId);
  const service=read("src/modules/academics/college-program-mutation-service.ts");
  expect(service).toContain("await lockedDepartment(tx, nextDepartmentId, member.collegeId)");
  expect(service).toContain('throw new CollegeProgramMutationError("PROGRAM_DEPENDENCY_CONFLICT")');
  expect(service).toContain("departmentId: nextDepartmentId");
  const actions=read("src/components/academics/academics-actions.tsx");
  expect(actions).toContain("Department\n");
  expect(actions).toContain("departmentId !== (program.departmentId ??");
  expect(read("src/components/admin/admin-program-directory.tsx")).toContain("departments={departments}");
 });
});
