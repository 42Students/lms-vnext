import {describe,expect,it} from "vitest";
import {mayMutateProjectWithRole,PROJECT_MEMBER_ROLE_KINDS} from "@/modules/projects/member-role-kind-model";
import {readFileSync} from "node:fs";
const stage=readFileSync(new URL("../../src/modules/projects/staged-schema.ts",import.meta.url),"utf8");
const sql=readFileSync(new URL("../../docs/proposed-migrations/pr-s2-08-member-kinds.sql",import.meta.url),"utf8");
describe("PR-S2-08 staged role kinds",()=>{
  it("only mentor kinds can write when explicitly enabled",()=>{
    expect(mayMutateProjectWithRole("MENTOR",true)).toBe(true);
    expect(mayMutateProjectWithRole("CO_MENTOR",true)).toBe(true);
    expect(mayMutateProjectWithRole("CO_MENTOR",false)).toBe(false);
    for(const role of ["OBSERVER","REVIEWER","QA","LEARNER"] as const)
      expect(mayMutateProjectWithRole(role,true)).toBe(false);
  });
  it("stages the columns and enforces read-only defaults",()=>{
    expect(PROJECT_MEMBER_ROLE_KINDS).toContain("CO_MENTOR");
    expect(stage).toContain('varchar("role_kind"');
    expect(sql).toContain("project_members_readonly_role_ck");
  });
});
