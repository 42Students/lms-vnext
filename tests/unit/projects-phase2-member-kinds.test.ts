import {describe,expect,it} from "vitest";
import {mayMutateProjectWithRole,PROJECT_MEMBER_ROLE_KINDS} from "@/modules/projects/member-role-kind-model";
import {readFileSync} from "node:fs";
const stage=readFileSync(new URL("../../src/db/schema/projects.ts",import.meta.url),"utf8");
const sql=readFileSync(new URL("../../drizzle/0083_project_member_kinds.sql",import.meta.url),"utf8");
describe("PR-S2-08 registered role kinds",()=>{
  it("only mentor kinds can write when explicitly enabled",()=>{
    expect(mayMutateProjectWithRole("MENTOR",true)).toBe(true);
    expect(mayMutateProjectWithRole("CO_MENTOR",true)).toBe(true);
    expect(mayMutateProjectWithRole("CO_MENTOR",false)).toBe(false);
    for(const role of ["OBSERVER","REVIEWER","QA","LEARNER"] as const)
      expect(mayMutateProjectWithRole(role,true)).toBe(false);
  });
  it("registers the columns and enforces read-only defaults",()=>{
    expect(PROJECT_MEMBER_ROLE_KINDS).toContain("CO_MENTOR");
    expect(stage).toContain('varchar("role_kind"');
    expect(sql).toContain("project_members_readonly_role_ck");
  });
});
