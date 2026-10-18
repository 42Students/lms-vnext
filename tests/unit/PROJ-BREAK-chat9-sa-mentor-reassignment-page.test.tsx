import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminProjectReassignMentorRoute from "@/app/(authenticated)/admin/projects/reassign-mentor/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const state=vi.hoisted(()=>({scoped:true,allowed:true}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",
      systemRoles:["SUPER_ADMIN"]},membership:null,
    adminScope:state.scoped?{
      collegeId:"11111111-1111-4111-8111-111111111111",
      organizationId:"22222222-2222-4222-8222-222222222222",
    }:null,
  }),
}));
vi.mock("@/modules/permissions/policy",()=>({
  can:(_ctx:unknown,permission:string,resource:{collegeId:string;organizationId:string})=>
    state.allowed&&permission==="projects.manage"&&
    resource.collegeId==="11111111-1111-4111-8111-111111111111"&&
    resource.organizationId==="22222222-2222-4222-8222-222222222222",
}));
vi.mock("@/components/projects/project-admin-reassign-mentor-page",()=>({
  ProjectAdminReassignMentorPage:function ProjectAdminReassignMentorPage(){return null;},
}));
function elements(node:unknown):unknown[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(Array.isArray(node))return node.flatMap(elements);
  if(!isValidElement(node))return [node];
  const props=node.props as Record<string,unknown>;
  return [node,...["children","title","description","action","href"].flatMap(k=>elements(props[k]))];
}
const text=(nodes:unknown[])=>nodes.filter((item):item is string=>typeof item==="string").join(" ");
const render=()=>SuperAdminProjectReassignMentorRoute({searchParams:Promise.resolve({})});
beforeEach(()=>{state.scoped=true;state.allowed=true;});
describe("IIT Dharwad Super Admin bulk project mentor reassignment access",()=>{
  it("PROJ-BREAK-idor-59 denied college permission stops mentor assignment controls",async()=>{
    state.allowed=false;
    const nodes=elements(await render());
    expect(text(nodes)).toContain("Mentor reassignment access denied");
    expect(nodes.some(x=>isValidElement(x)&&typeof x.type==="function"&&
      x.type.name==="ProjectAdminReassignMentorPage")).toBe(false);
  });
  it("PROJ-BREAK-ux-44 missing college never substitutes organization-wide default",async()=>{
    state.scoped=false;
    const nodes=elements(await render());
    expect(text(nodes)).toContain("Select a college scope");
    expect(nodes.some(x=>isValidElement(x)&&typeof x.type==="function"&&
      x.type.name==="ProjectAdminReassignMentorPage")).toBe(false);
  });
  it("PROJ-BREAK-idor-60 authorized scope is forwarded unchanged to the reassignment view",async()=>{
    const result=await render();
    expect(isValidElement(result)).toBe(true);
    const props=result.props as {collegeId:string;basePath:string};
    expect(props.collegeId).toBe(collegeId);
    expect(props.basePath).toBe("/admin/projects");
  });
});
