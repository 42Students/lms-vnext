import {describe,it,expect} from "vitest";
import {addProjectMemberInputSchema,updateProjectMemberInputSchema} from "@/modules/projects/validation";
import {mayMutateProjectWithRole} from "@/modules/projects/member-role-kind-model";
import {readFileSync} from "node:fs";
const access=readFileSync(new URL("../../src/modules/projects/access.ts",import.meta.url),"utf8");
describe("PR-S2-08 runtime role-kind gate",()=>{
  it("rejects writable reviewer/observer kind and invalid primary role",()=>{
    const id="aaaabbbb-cccc-4ddd-8eee-ffffffffffff";
    expect(addProjectMemberInputSchema.safeParse({membershipId:id,role:"MENTOR",roleKind:"OBSERVER",canMutate:true}).success).toBe(false);
    expect(addProjectMemberInputSchema.safeParse({membershipId:id,role:"MENTOR",roleKind:"CO_MENTOR",isPrimary:true}).success).toBe(false);
    expect(addProjectMemberInputSchema.safeParse({membershipId:id,role:"MENTOR",roleKind:"CO_MENTOR"}).success).toBe(true);
    expect(updateProjectMemberInputSchema.safeParse({roleKind:"QA",canMutate:false}).success).toBe(true);
  });
  it("reads persisted role-kind before granting Mentor mutations",()=>{
    expect(access).toContain("projectMembers.roleKind");expect(access).toContain("projectMembers.canMutate");
    expect(access).toContain("mayMutateProjectWithRole");
    for(const role of ["OBSERVER","REVIEWER","QA"] as const)expect(mayMutateProjectWithRole(role,true)).toBe(false);
  });
});
