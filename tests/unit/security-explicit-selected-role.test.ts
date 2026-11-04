import {describe,expect,it} from "vitest";
import {narrowToActiveRole} from "@/modules/identity/context-service";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {workspaceChoices,selectedWorkspaceChoice}
 from "@/components/shell/membership-switcher";

const college="11111111-1111-4111-8111-111111111111";
const org="22222222-2222-4222-8222-222222222222";
const member="33333333-3333-4333-8333-333333333333";
function context(roles: NonNullable<RequestContext["membership"]>["roles"]):RequestContext {
 return {user:{id:"user",identityUid:"actor",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:member,collegeId:college,organizationId:org,status:"ACTIVE",roles}};
}
describe("selected-role authorization must fail closed",()=>{
 it("does not silently choose College Admin for a multirole learner on absent selection",()=>{
  const roles=narrowToActiveRole(["COLLEGE_ADMIN","LEARNER"],null);
  expect(roles).toEqual([]);
  expect(hasMembershipRole(context(roles),"COLLEGE_ADMIN")).toBe(false);
  expect(can(context(roles),"people.manage",{collegeId:college,organizationId:org})).toBe(false);
 });
 it("rejects a revoked role instead of silently selecting the remaining role",()=>{
  expect(narrowToActiveRole(["LEARNER"],"COLLEGE_ADMIN")).toEqual([]);
  expect(narrowToActiveRole(["LEARNER","COLLEGE_ADMIN"],"FACULTY")).toEqual([]);
 });
 it("permits exactly the selected live role and preserves a single-role membership",()=>{
  expect(narrowToActiveRole(["COLLEGE_ADMIN","LEARNER"],"LEARNER")).toEqual(["LEARNER"]);
  expect(narrowToActiveRole(["COLLEGE_ADMIN","LEARNER"],"COLLEGE_ADMIN")).toEqual(["COLLEGE_ADMIN"]);
  expect(narrowToActiveRole(["LEARNER"],null)).toEqual(["LEARNER"]);
  expect(narrowToActiveRole([],null)).toEqual([]);
 });
 it("keeps the workspace switcher selectable when an ambiguous role is denied",()=>{
  const choices=workspaceChoices([{
    id:member,collegeId:college,organizationId:org,
    collegeName:"College A",organizationName:"Org",collegeCode:"A",
    status:"ACTIVE",roles:["LEARNER","COLLEGE_ADMIN"],
  }]);
  expect(choices).toHaveLength(2);
  expect(selectedWorkspaceChoice(choices,member,null)).toBeNull();
  expect(selectedWorkspaceChoice(choices,member,"FACULTY")).toBeNull();
  expect(selectedWorkspaceChoice(choices,member,"LEARNER")?.role).toBe("LEARNER");
 });
});
