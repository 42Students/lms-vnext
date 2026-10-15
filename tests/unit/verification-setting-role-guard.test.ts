import {describe,it,expect} from "vitest";
import {can} from "@/modules/permissions/policy";
describe("verification setting actor role gate",()=>{it("rejects wrong-role college memberships",()=>{
 const context={user:{id:"u",identityUid:"identity",platformStatus:"ACTIVE" as const,systemRoles:[]},
 membership:{id:"m",collegeId:"c",organizationId:"o",status:"ACTIVE" as const,roles:["LEARNER" as const]}};
 expect(can(context,"college.manage",{collegeId:"c",organizationId:"o"})).toBe(false);
});});
