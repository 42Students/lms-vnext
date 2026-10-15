import { describe, expect, it } from "vitest";
import { collegeAdminItems, getShellNavigation } from "@/components/shell/shell-model";
import type { RequestContext } from "@/modules/identity/context";

const legacyCollegeSidebar = [
  ["Dashboard", "/college"],
  ["Activity Log", "/college/activity"],
  ["Academic Setup", "/college/departments"],
  ["Courses & Content", "/college/courses"],
  ["People", "/college/people"],
  ["Profile verification", "/college/verification"],
  ["Placements", "/college/placements"],
  ["Placement cell", "/tpo/home"],
  ["Projects", "/college/projects/workspaces"],
  ["Profile", "/college/profile"],
] as const;

const context: RequestContext = {
  user:{id:"staff",identityUid:"staff",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{
    id:"member",collegeId:"college",organizationId:"org",
    status:"ACTIVE",roles:["COLLEGE_ADMIN"],
  },
  recruiter:null,
};

describe("legacy College Admin exact sidebar copy", () => {
  it("matches the ten labels, case and source ordering verbatim", () => {
    expect(collegeAdminItems.map(({label,href})=>[label,href])).toEqual(legacyCollegeSidebar);
  });
  it("shows only the legacy grouped menu for a college-only account", () => {
    expect(getShellNavigation(context)).toEqual(collegeAdminItems);
    expect(getShellNavigation(context).some(item=>item.label==="My College")).toBe(false);
    expect(getShellNavigation(context).some(item=>item.label==="Placement Evidence")).toBe(false);
  });
  it("keeps college navigation visible for multi-role faculty administrators", () => {
    const mixed: RequestContext = {
      ...context,membership:{...context.membership!,roles:["COLLEGE_ADMIN","FACULTY"]},
    };
    const items=getShellNavigation(mixed);
    expect(items.some(item=>item.href==="/college/verification" && item.label==="Profile verification")).toBe(true);
    expect(items.some(item=>item.href==="/teacher/courses")).toBe(true);
  });
});
