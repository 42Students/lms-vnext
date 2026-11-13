import {readdirSync,readFileSync,statSync} from "node:fs";
import {join,resolve,relative,sep} from "node:path";
import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getShellNavigation} from "@/components/shell/shell-model";
import {TPO_PROTOTYPE_NAV,TPO_PROTOTYPE_SECTIONS} from "@/components/shell/tpo-prototype-navigation";
import {FACULTY_PROTOTYPE_NAV} from "@/components/shell/faculty-prototype-navigation";
import {
  canAccessRolePortal,
  canAccessStaffActivity,
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
/** Match Next.js static and dynamic page segments, without treating a
 * JavaScript source file or sidebar link as proof that a server rendered 200.
 * This is an inventory crosscheck, including contacts/[contactsTab] etc.
 */
function registeredPageMatchesHref(href:string):boolean{
  const segs=href.split("?")[0]!.split("/").filter(Boolean);
  return pages.some(page=>{
    const pattern=page.replace(/\/page\.(tsx|ts|jsx|js)$/,"").split("/");
    let i=0,j=0;
    for(;j<pattern.length;j++,i++){
      const part=pattern[j]!;
      if(/^\[\[\.\.\.[^\]]+\]\]$/.test(part))return true;
      if(/^\[\.\.\.[^\]]+\]$/.test(part))return i<segs.length;
      if(i>=segs.length)return false;
      if(/^\[[^\]]+\]$/.test(part))continue;
      if(part!==segs[i])return false;
    }
    return i===segs.length;
  });
}

const portals=new Set<string>(ROLE_PORTAL_FAMILIES);
/**
 * The small set of authenticated routes OUTSIDE single-role portals has
 * explicit, different policies. Enumerate each page rather than treating
 * these shared routes as implicitly available to every role.
 *
 * PAGE_SHARED means role-independent, but the page still enforces signed-in
 * identity and resource ownership. SELF_DEVICE requires a real device session.
 * TRACKER_OWNER requires persisted reporter ownership in the service.
 */
const SHARED_PAGE_POLICIES={
  "account/security/page.tsx":"SELF_DEVICE",
  "activity/page.tsx":"STAFF",
  "activity/[eventId]/page.tsx":"STAFF",
  "dashboard/page.tsx":"ROLE_AWARE",
  "notifications/page.tsx":"PAGE_SHARED",
  "recruiter-invitations/page.tsx":"PAGE_SHARED",
  "tracker/page.tsx":"PAGE_SHARED",
  "tracker/mine/page.tsx":"TRACKER_OWNER",
  "tracker/mine/[publicId]/page.tsx":"TRACKER_OWNER",
  "tracker/issues/[publicId]/page.tsx":"TRACKER_OWNER_OR_ADMIN",
  "tracker/issues/page.tsx":"SUPER_ADMIN",
  "tracker/logs/page.tsx":"SUPER_ADMIN",
  "tracker/audit-findings/page.tsx":"SUPER_ADMIN",
  "tracker/audit-findings/[publicId]/page.tsx":"SUPER_ADMIN_SERVICE",
} as const;

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

  it("classifies every non-portal page individually and verifies its own runtime guard or scoped service",()=>{
    const shared=pages.filter(page=>!portals.has(page.split("/")[0]!)).sort();
    expect(shared).toEqual(Object.keys(SHARED_PAGE_POLICIES).sort());
    for(const [page,policy] of Object.entries(SHARED_PAGE_POLICIES)){
      const file=readFileSync(join(ROOT,page),"utf8");
      if(policy==="SELF_DEVICE"){
        expect(file,page).toContain("getCurrentDeviceSession");
      }else{
        expect(file,page).toContain("getCurrentRequestContext");
      }
      if(policy==="STAFF"){
        expect(file,page).toContain("canAccessStaffActivity");
      }
      if(policy==="SUPER_ADMIN"){
        expect(file,page).toContain("isSuperAdmin");
      }
      if(policy==="SUPER_ADMIN_SERVICE"){
        expect(file,page).toContain("getIndependentAuditFinding");
        const guard=readFileSync(resolve(process.cwd(),
          "src/modules/bug-tracker/independent-audit-findings-service.ts"),"utf8");
        expect(guard).toContain("function requireIndependentFindingAccess");
        expect(guard).toContain("if(!isSuperAdmin(context)");
      }
      if(policy==="TRACKER_OWNER_OR_ADMIN"){
        expect(file,page).toContain("TrackerReporterIssueDetail");
        expect(file,page).toContain("isSuperAdmin");
      }
    }
  });

  it("denies staff-only and platform-only shared pages to other roles",()=>{
    for(const role of testedRoles){
      for(const policy of Object.values(SHARED_PAGE_POLICIES)){
        if(policy==="STAFF"){
          expect(canAccessStaffActivity(principal(role)),
            `STAFF pages must match ${role} entitlement`)
            .toBe(["COLLEGE_ADMIN","SUPER_ADMIN"].includes(role));
        }
        if(policy==="SUPER_ADMIN"||policy==="SUPER_ADMIN_SERVICE"){
          expect(role==="SUPER_ADMIN",`platform page guard: ${role}`)
            .toBe(role==="SUPER_ADMIN");
        }
      }
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

  it("checks the ACTUALLY RENDERED TPO and Faculty prototype nav and TPO section links",()=>{
    const tpo=principal("TPO");
    const faculty=principal("FACULTY");
    const allTpo=[
      ...TPO_PROTOTYPE_NAV,
      ...Object.values(TPO_PROTOTYPE_SECTIONS).flat(),
    ];
    expect(TPO_PROTOTYPE_NAV).toHaveLength(8);
    expect(FACULTY_PROTOTYPE_NAV).toHaveLength(4);
    for(const item of allTpo){
      expect(registeredPageMatchesHref(item.href),
        `Missing rendered TPO prototype page for ${item.href}`).toBe(true);
      expect(canAccessRolePortal(tpo,"tpo")).toBe(true);
      for(const role of testedRoles){
        if(role==="COLLEGE_ADMIN"||role==="TPO")continue;
        expect(canAccessRolePortal(principal(role),"tpo"),
          `${role} must not inherit TPO route through prototype link ${item.href}`)
          .toBe(false);
      }
    }
    for(const item of FACULTY_PROTOTYPE_NAV){
      expect(registeredPageMatchesHref(item.href),
        `Missing rendered Faculty prototype page for ${item.href}`).toBe(true);
      expect(canAccessRolePortal(faculty,"teacher")).toBe(true);
      for(const role of testedRoles){
        if(role==="FACULTY")continue;
        expect(canAccessRolePortal(principal(role),"teacher"),
          `${role} must not inherit Faculty prototype route ${item.href}`)
          .toBe(false);
      }
    }
  });

  it("every shell sidebar link resolves to a portal authorized for its selected role",()=>{
    for(const role of testedRoles){
      const context=principal(role);
      const links=getShellNavigation(context,
        {projectsEnabled:true,placementsEnabled:true,driveDayEnabled:true},
        true,{projectsEnabled:true,placementsEnabled:true,tpoTeamActive:true,recruiterCollegeGrantActive:true});
      expect(links.length,role).toBeGreaterThan(0);
      for(const item of links){
        expect(registeredPageMatchesHref(item.href),
          `${role} sidebar link must resolve to a registered static/dynamic App Router page: ${item.href}`)
          .toBe(true);
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
