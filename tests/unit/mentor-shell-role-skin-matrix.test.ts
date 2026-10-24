import {describe,expect,it} from "vitest";
import {narrowToActiveRole} from "@/modules/identity/context-service";
import {getShellNavigation,scopedShellNavigation}
  from "@/components/shell/shell-model";
import {prototypeRoleSkinForPath as skin}
  from "@/components/shell/prototype-role-skin-model";
import type {RequestContext} from "@/modules/identity/context";
function context(roles:readonly ("MENTOR"|"FACULTY"|"TPO"|"COLLEGE_ADMIN")[]):RequestContext{
 return {user:{id:"u",identityUid:"user",platformStatus:"ACTIVE",
   systemRoles:[]},membership:{id:"m",collegeId:"college",organizationId:"org",
     status:"ACTIVE",roles}};
}
describe("Mentor multi-role role-switch and prototype-skin isolation",()=>{
 it("selects only one current member role, not combined permissions",()=>{
  expect(narrowToActiveRole(["FACULTY","MENTOR"],"MENTOR")).toEqual(["MENTOR"]);
  expect(narrowToActiveRole(["FACULTY","MENTOR"],"FACULTY")).toEqual(["FACULTY"]);
  expect(narrowToActiveRole(["COLLEGE_ADMIN","TPO"],"TPO")).toEqual(["TPO"]);
  expect(narrowToActiveRole(["COLLEGE_ADMIN","TPO"],"COLLEGE_ADMIN"))
    .toEqual(["COLLEGE_ADMIN"]);
 });
 it("provides the selected Mentor's nav but not the faculty or TPO nav",()=>{
  const role=narrowToActiveRole(["FACULTY","MENTOR"],"MENTOR");
  const links=getShellNavigation(context(role)).map(item=>item.href);
  expect(links).toContain("/mentor/calendar");
  expect(links).not.toContain("/teacher/courses");
  expect(links).not.toContain("/tpo/home");
 });
 it("does not promote College Admin's Placement shortcut to TPO skin",()=>{
  const items=getShellNavigation(context(["COLLEGE_ADMIN"]));
  const shown=scopedShellNavigation(items,"/tpo/home").map(row=>row.href);
  expect(shown).toContain("/tpo/home");
  expect(shown).not.toContain("/tpo/calendar");
  expect(skin({pathname:"/tpo/home",mentorEnabled:false,
    tpoEnabled:false,recruiterEnabled:false})).toBeNull();
  expect(skin({pathname:"/tpo/home",mentorEnabled:false,
    tpoEnabled:true,recruiterEnabled:false})).toBe("tpo");
 });
 it("honors the current route and its actual role, never substring matches",()=>{
  const mixed={mentorEnabled:true,tpoEnabled:true,recruiterEnabled:false};
  expect(skin({...mixed,pathname:"/mentor/projects"})).toBe("mentor");
  expect(skin({...mixed,pathname:"/tpo/home"})).toBe("tpo");
  expect(skin({...mixed,pathname:"/mentorx/projects"})).toBeNull();
  expect(skin({...mixed,pathname:"/tpo-fake"})).toBeNull();
  expect(skin({...mixed,tpoEnabled:false,pathname:"/tpo/home"})).toBeNull();
 });
});
