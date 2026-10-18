import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import ProjectAtRiskRoute from "@/app/(authenticated)/admin/projects/at-risk/page";
import ProjectSubmissionsRoute from "@/app/(authenticated)/admin/projects/submissions/page";
import ProjectReadinessRoute from "@/app/(authenticated)/admin/projects/readiness/page";
import ProjectAuditRoute from "@/app/(authenticated)/admin/projects/audit/page";

const state=vi.hoisted(()=>({
  role:"SUPER_ADMIN" as "SUPER_ADMIN"|"COLLEGE_ADMIN"|"DISABLED",
  selected:true,scopeCalls:0,auditScopeChecks:0,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"actor",identityUid:"u",
      platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
      systemRoles:state.role==="COLLEGE_ADMIN"?[]:["SUPER_ADMIN"]},
    membership:null,
    adminScope:{organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111"},
  }),
}));
vi.mock("@/modules/projects/admin-college-scope",()=>({
  getProjectAdminCollegeId:()=>{
    state.scopeCalls++;
    return state.selected?"11111111-1111-4111-8111-111111111111":null;
  },
}));
vi.mock("@/modules/projects/admin-audit-access-model",()=>({
  mayReadGlobalProjectAudit:()=>{
    state.auditScopeChecks++;
    return false;
  },
}));
function words(node:unknown):string[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(words);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","action","href","eyebrow"].flatMap(k=>words(props[k]));
}
const routes=[
  {title:"At-risk projects",run:()=>ProjectAtRiskRoute({searchParams:Promise.resolve({})})},
  {title:"Project submissions",run:()=>ProjectSubmissionsRoute({searchParams:Promise.resolve({})})},
  {title:"Submission readiness",run:()=>ProjectReadinessRoute({searchParams:Promise.resolve({})})},
  {title:"Project audit",run:()=>ProjectAuditRoute({searchParams:Promise.resolve({})})},
];
beforeEach(()=>{state.role="SUPER_ADMIN";state.selected=true;state.scopeCalls=0;state.auditScopeChecks=0;});

describe("IIT Dharwad Super Admin last-third Project route authorization",()=>{
  it("PROJ-BREAK-admin-idor-30 all four admin queues reject college-only and disabled actors before scope or data lookup",async()=>{
    for(const role of ["COLLEGE_ADMIN","DISABLED"] as const){
      state.role=role;
      for(const route of routes){
        const content=words(await route.run()).join(" ");
        expect(content,route.title).toContain(route.title);
        expect(content,route.title).toContain("Project access denied");
        expect(content,route.title).toContain("Back to dashboard");
        expect(content,route.title).not.toContain("Choose a college");
      }
    }
    expect(state.scopeCalls).toBe(0);
    expect(state.auditScopeChecks).toBe(0);
  });
  it("PROJ-BREAK-admin-idor-31 active scoped Super Admin passes the exact college to each route",async()=>{
    for(const route of routes){
      const result=await route.run();
      const content=words(result).join(" ");
      expect(content).not.toContain("Project access denied");
    }
    expect(state.scopeCalls).toBe(4);
  });
  it("PROJ-BREAK-admin-idor-32 missing college stays on a recoverable selection state, not another tenant",async()=>{
    state.selected=false;
    for(const route of routes){
      const content=words(await route.run()).join(" ");
      expect(content).toContain("Select a college");
      expect(content).not.toContain("Project access denied");
    }
    expect(state.scopeCalls).toBe(4);
    expect(state.auditScopeChecks).toBe(1);
  });
});
