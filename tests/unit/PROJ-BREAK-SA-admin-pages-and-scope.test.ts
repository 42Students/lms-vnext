import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { can } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";

const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const root="src/app/(authenticated)/admin";
const pageFiles=(rootPath:string):string[]=>readdirSync(rootPath,{withFileTypes:true}).flatMap(entry=>{
  const path=join(rootPath,entry.name);
  return entry.isDirectory()?pageFiles(path):entry.name==="page.tsx"?[relative(process.cwd(),path).replaceAll("\\","/")]:[];
});
const delegated:Record<string,{contains:string; target?:string}>={
  // Hiring is a legacy alias; authorization and college scoping happen on the destination.
  "placements/hiring/page.tsx":{contains:'redirect("/admin/placements/analytics',target:"placements/analytics/page.tsx"},
  "projects/[projectId]/page.tsx":{contains:"redirect(",target:"projects/[projectId]/[section]/page.tsx"},
  "projects/workspaces/[workspaceId]/page.tsx":{contains:'redirect("/admin/projects/"+encodeURIComponent(workspaceId))',target:"projects/[projectId]/page.tsx"},
  "projects/[projectId]/[section]/page.tsx":{contains:"AdminProjectSectionPage",target:"src/components/projects/admin-project-section-page.tsx"},
  "projects/[projectId]/readiness/page.tsx":{contains:"ProjectWorkspaceReadiness",target:"src/components/projects/project-workspace-readiness.tsx"},
  "projects/templates/[templateId]/resources/page.tsx":{contains:"SuperAdminTemplateSubviewPage",target:"src/components/projects/super-admin-template-subview-page.tsx"},
  "projects/templates/[templateId]/sprints/page.tsx":{contains:"SuperAdminTemplateSubviewPage",target:"src/components/projects/super-admin-template-subview-page.tsx"},
  "projects/templates/[templateId]/tasks/page.tsx":{contains:"SuperAdminTemplateSubviewPage",target:"src/components/projects/super-admin-template-subview-page.tsx"},
  "projects/templates/[templateId]/versions/page.tsx":{contains:"SuperAdminTemplateSubviewPage",target:"src/components/projects/super-admin-template-subview-page.tsx"},
};

const actor=(opts?:{role?:"SUPER_ADMIN"|"NONE";status?:"ACTIVE"|"DISABLED";collegeId?:string|null;organizationId?:string|null;membershipRole?:"COLLEGE_ADMIN"|"LEARNER"|"NONE"}):RequestContext=>({
  user:{id:"user-a",identityUid:"identity-a",platformStatus:opts?.status??"ACTIVE",
    systemRoles:opts?.role==="NONE"?[]:["SUPER_ADMIN"]},
  adminScope: {collegeId:opts?.collegeId===undefined?"college-a":opts.collegeId,
    organizationId:opts?.organizationId===undefined?"org-a":opts.organizationId},
  membership:opts?.membershipRole&&opts.membershipRole!=="NONE"?{
    id:"membership-b",collegeId:"college-b",organizationId:"org-b",
    status:"ACTIVE",roles:[opts.membershipRole],
  }:null,
});

describe("Super Admin Projects and Placements page routes — independent security and UX audit",()=>{
  it("PROJ-BREAK-SA-14 confines global/selected and dual-role SA project navigation to the selected college",()=>{
    const adminA=actor();
    expect(getProjectAdminCollegeId(adminA)).toBe("college-a");
    expect(can(adminA,"projects.manage",{collegeId:"college-a",organizationId:"org-a"})).toBe(true);
    expect(can(adminA,"projects.manage",{collegeId:"college-b",organizationId:"org-b"})).toBe(false);
    const dual=actor({membershipRole:"COLLEGE_ADMIN"});
    expect(getProjectAdminCollegeId(dual)).toBe("college-a");
    expect(can(dual,"projects.manage",{collegeId:"college-b",organizationId:"org-b"})).toBe(false);
    expect(getProjectAdminCollegeId(actor({collegeId:null}))).toBeNull();
    expect(getProjectAdminCollegeId(actor({status:"DISABLED"}))).toBeNull();
    expect(getProjectAdminCollegeId(actor({role:"NONE",membershipRole:"NONE"}))).toBeNull();
    const collegeActor:RequestContext={...dual,user:{...dual.user,systemRoles:[]},adminScope:null};
    expect(getProjectAdminCollegeId(collegeActor)).toBe("college-b");
    const unrelated:RequestContext={...collegeActor,membership:{...collegeActor.membership!,roles:["LEARNER"]}};
    expect(getProjectAdminCollegeId(unrelated)).toBeNull();
  });

  it("PROJ-BREAK-SA-15 audits every live /admin placement/project page for auth or scope-enforcing delegate",()=>{
    const paths=pageFiles(join(process.cwd(),root))
      .filter(p=>p.startsWith(root+"/projects/")||p.startsWith(root+"/placements/")||
        p===root+"/projects/page.tsx"||p===root+"/placements/page.tsx");
    expect(paths.length).toBeGreaterThanOrEqual(48);
    for(const path of paths){
      const page=source(path),subpath=path.slice((root+"/").length);
      const delegate=delegated[subpath];
      if(delegate){
        expect(page,path).toContain(delegate.contains);
        if(delegate.target&&delegate.target.startsWith("src/")){
          const component=source(delegate.target);
          expect(component,path).toContain("getCurrentRequestContext");
          expect(component,path).toMatch(/requireProjectManageAccess|can\(context,\s*"project-template.manage"|getSuperAdminTemplateSubview/);
        }else if(delegate.target){
          const target=source(root+"/"+delegate.target);
          if(delegate.target.startsWith("placements/")){
            expect(target,path).toContain("getCurrentRequestContext");
            expect(target,path).toContain("requireSuperAdminSelectedCollege");
          }else if(delegate.target==="projects/[projectId]/page.tsx"){
            expect(target,path).toContain("getCurrentRequestContext");
            expect(target,path).toContain("requireProjectManageAccess");
          }else expect(target,path).toContain("AdminProjectSectionPage");
        }
      }else{
        expect(page,path).toContain("getCurrentRequestContext");
      }
      // Semantic data tables are permitted when they have an accessible name
      // and scoped column/row headers. Reject anonymous tables instead.
      if (/<table(?:\\s|>)/.test(page)) {
        expect(page,path).toMatch(/<caption(?:\\s|>)/);
        expect(page,path).toMatch(/<th\\s+scope=(?:"|')col(?:"|')/);
        expect(page,path).toMatch(/<th\\s+scope=(?:"|')row(?:"|')/);
      }
      expect(page,path).not.toContain("window.confirm(");
      expect(page,path).not.toMatch(/target=(?:"|')_blank(?:"|')/);
      expect(page,path).not.toContain("JSON.stringify(error)");
    }
    expect(paths.some(p=>p.endsWith("/admin/projects/submissions/page.tsx"))).toBe(true);
    expect(paths.some(p=>p.endsWith("/admin/placements/jobs/[jobId]/settings/page.tsx"))).toBe(true);
  });

  it("PROJ-BREAK-SA-16 delegates dynamic project IDs to persisted project ownership checks",()=>{
    const section=source("src/components/projects/admin-project-section-page.tsx");
    const readiness=source("src/components/projects/project-workspace-readiness.tsx");
    const template=source("src/components/projects/super-admin-template-subview-page.tsx");
    const access=source("src/modules/projects/access.ts");
    for(const component of [section,readiness]) expect(component).toContain("requireProjectManageAccess");
    expect(template).toContain("getSuperAdminTemplateSubview(");
    expect(template).toMatch(/projectTemplateIdSchema\.safeParse\(\s*templateId,?\s*\)\.success/);
    expect(access).toContain('can(context, "projects.manage", {');
    expect(access).toContain("organizationId: scope.organizationId");
    expect(access).toContain("collegeId: scope.collegeId");
    expect(access).toContain('throw new ProjectsServiceError(\n      "PROJECT_ACCESS_DENIED"');
  });
});
