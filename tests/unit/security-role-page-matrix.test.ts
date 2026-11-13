import {readdirSync,readFileSync,statSync} from "node:fs";
import {join,resolve,relative,sep} from "node:path";
import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getShellNavigation} from "@/components/shell/shell-model";
import {
  canAccessRolePortal,
  ROLE_PORTAL_FAMILIES,
  type RolePortalFamily,
} from "@/modules/identity/role-portal-policy";

/**
 * #61/#101 — exhaustive role-to-page FAMILY matrix.
 * Reads the entire registered App Router page tree, including deep dynamic
 * pages and legacy redirects, instead of testing just a manually selected
 * handful of sidebar links. Every protected subtree has a runtime layout
 * calling the very same policy exercised in this matrix.
 *
 * Does not assert HTTP status or API/resource authorization; those require
 * seeded browser/API tests with an active test server and are tracked
 * separately. This is a preventive page-entry control.
 */
const ROOT=resolve(process.cwd(),"src/app/(authenticated)");
const SHARED_ROOTS=new Set([
  "dashboard","account","activity","notifications","tracker","recruiter-invitations",
]);

function discoverPages(dir:string):string[] {
  return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=join(dir,entry.name);
    if(entry.isDirectory())return discoverPages(full);
    return /^page\.(tsx|jsx|ts|js)$/.test(entry.name)
      ?[relative(ROOT,full).split(sep).join("/")]:[];
  });
}
const pages=discoverPages(ROOT);
const portals=new Set<string>(ROLE_PORTAL_FAMILIES);
const testedRoles=["SUPER_ADMIN","COLLEGE_ADMIN","TPO","FACULTY","MENTOR","LEARNER","RECRUITER"] as const;
type Role=typeof testedRoles[number];
const expected:Record<Role,readonly RolePortalFamily[]>={
  SUPER_ADMIN:["admin","superadmin"],
  COLLEGE_ADMIN:["college","college-admin","tpo"],
  TPO:["tpo"],
  FACULTY:["teacher","teach"],
  MENTOR:["mentor"],
  LEARNER:["learn"],
  RECRUITER:["hr","recruiter"],
};

function principal(role:Role, options:{
  status?:"ACTIVE"|"DISABLED";
  membershipStatus?:"ACTIVE"|"SUSPENDED";
  selectedRoles?:readonly ("LEARNER"|"FACULTY"|"MENTOR"|"TPO"|"COLLEGE_ADMIN")[];
  withRecruiter?:boolean;
}={}):RequestContext{
  const membershipRole=role==="RECRUITER"||role==="SUPER_ADMIN"?null:role;
  const userId="30000000-0000-4000-8000-000000000099";
  const collegeId="20000000-0000-4000-8000-000000000099";
  const organizationId="10000000-0000-4000-8000-000000000099";
  const withRecruiter=options.withRecruiter??role==="RECRUITER";
  return {
    user:{
      id:userId,identityUid:"role-route-matrix-principal",
      platformStatus:options.status??"ACTIVE",
      systemRoles:role==="SUPER_ADMIN"?["SUPER_ADMIN"]:[],
    },
    membership:membershipRole?{
      id:"40000000-0000-4000-8000-000000000099",
      collegeId,organizationId,
      status:options.membershipStatus??"ACTIVE",
      roles:options.selectedRoles??[membershipRole],
    }:null,
    recruiter:withRecruiter?{
      userId,companyId:"60000000-0000-4000-8000-000000000099",
      companyName:"Test Recruiting Company",title:null,status:"ACTIVE",
      grants:[{
        id:"70000000-0000-4000-8000-000000000099",
        collegeId,organizationId,collegeName:"Test college",
        companyRelationshipId:"80000000-0000-4000-8000-000000000099",
      }],
    }:null,
  };
}

describe("#61/#101 all role portal families against registered App Router pages",()=>{
  it("accounts for every authenticated page, including legacy and dynamic routes",()=>{
    expect(pages.length).toBeGreaterThan(500);
    expect(pages.filter(page=>page.includes("["))).not.toHaveLength(0);
    const roots=[...new Set(pages.map(path=>path.split("/")[0]!))].sort();
    expect(roots).toEqual([...new Set([...ROLE_PORTAL_FAMILIES,...SHARED_ROOTS])].sort());
    for(const portal of ROLE_PORTAL_FAMILIES){
      expect(pages.some(page=>page.startsWith(portal+"/")),portal).toBe(true);
    }
  });

  it("enforces the EXACT tested role gate in each runtime parent layout",()=>{
    for(const family of ROLE_PORTAL_FAMILIES){
      const layout=join(ROOT,family,"layout.tsx");
      expect(statSync(layout).isFile(),layout).toBe(true);
      const source=readFileSync(layout,"utf8");
      expect(source,layout).toContain("canAccessRolePortal");
      expect(source.replace(/\s+/g,""),layout)
        .toContain(`canAccessRolePortal(context,"${family}")`);
    }
  });

  for(const role of testedRoles){
    it(`${role} can open every permitted page family and is denied ALL other protected page families`,()=>{
      const context=principal(role);
      let allowed=0,denied=0;
      for(const page of pages){
        const family=page.split("/")[0]!;
        if(!portals.has(family))continue;
        const actual=canAccessRolePortal(context,family as RolePortalFamily);
        const want=expected[role].includes(family as RolePortalFamily);
        expect(actual,`${role} ${want?"should open":"must be denied"} /${page}`).toBe(want);
        if(actual)allowed++;else denied++;
      }
      expect(allowed).toBeGreaterThan(0);
      expect(denied).toBeGreaterThan(0);
    });
  }

  it("every shell sidebar link resolves to a portal authorized for its selected role",()=>{
    for(const role of testedRoles){
      const context=principal(role);
      const links=getShellNavigation(context,
        {projectsEnabled:true,placementsEnabled:true,driveDayEnabled:true},
        true,{projectsEnabled:true,placementsEnabled:true,tpoTeamActive:true,recruiterCollegeGrantActive:true});
      expect(links.length,role).toBeGreaterThan(0);
      for(const item of links){
        const family=item.href.split("/")[1]!;
        expect(portals.has(family)||SHARED_ROOTS.has(family),
          `${role} unknown route family for ${item.href}`).toBe(true);
        if(portals.has(family)){
          expect(canAccessRolePortal(context,family as RolePortalFamily),
            `${role} sidebar points to forbidden ${item.href}`).toBe(true);
        }
      }
    }
  });

  it("disabled, suspended and unselected roles are denied across all protected page families",()=>{
    const disabled=principal("COLLEGE_ADMIN",{status:"DISABLED",withRecruiter:true});
    const suspended=principal("COLLEGE_ADMIN",{membershipStatus:"SUSPENDED"});
    const unselected=principal("LEARNER",{selectedRoles:[]});
    const ambiguous=principal("COLLEGE_ADMIN",{selectedRoles:["COLLEGE_ADMIN","LEARNER"]});
    const disabledPlatform=principal("SUPER_ADMIN",{status:"DISABLED"});
    for(const context of [disabled,suspended,unselected,ambiguous,disabledPlatform]){
      for(const family of ROLE_PORTAL_FAMILIES){
        expect(canAccessRolePortal(context,family),
          `${family} must refuse an invalid role claim`).toBe(false);
      }
    }
  });

  it("combined member+recruiter remains explicitly limited to its TWO authorized portal families",()=>{
    const context=principal("LEARNER",{withRecruiter:true});
    for(const family of ROLE_PORTAL_FAMILIES){
      expect(canAccessRolePortal(context,family),family)
        .toBe(["learn","hr","recruiter"].includes(family));
    }
    const links=getShellNavigation(context,
      {projectsEnabled:true,placementsEnabled:true},
      false,{projectsEnabled:true,placementsEnabled:true,recruiterCollegeGrantActive:true});
    expect(links.some(link=>link.href==="/learn/courses")).toBe(true);
    expect(links.some(link=>link.href==="/hr/home")).toBe(true);
    expect(links.some(link=>link.href.startsWith("/admin/"))).toBe(false);
    expect(links.some(link=>link.href.startsWith("/college/"))).toBe(false);
  });
});
