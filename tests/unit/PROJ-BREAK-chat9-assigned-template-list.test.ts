import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import {listAssignedProjectTemplates} from "@/modules/projects/template-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const otherCollegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const otherOrganizationId="44444444-4444-4444-8444-444444444444";
const state=vi.hoisted(()=>({reads:0,filters:[] as unknown[]}));
vi.mock("@/modules/projects/scope",()=>({
 loadProjectCollegeScope:async(id:string)=>({
  id,organizationId:id===otherCollegeId?otherOrganizationId:organizationId,
 }),
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>{
   state.reads+=1;
   const rows=[{assignmentId:"assignment",templateId:"template",slug:"safe",
    status:"PUBLISHED",version:3,title:"IIT Dharwad",summary:null,blueprint:{},assignedAt:new Date()}];
   const q={
    from:()=>q,
    innerJoin:()=>q,
    where:(filter:unknown)=>{state.filters.push(filter);return q;},
    orderBy:()=>q,
    then:(fn:(v:typeof rows)=>unknown)=>Promise.resolve(rows).then(fn),
   };
   return q;
  },
 }),
}));
const collegeAdmin=():RequestContext=>({
 user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"admin",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"66666666-6666-4666-8666-666666666666",
  collegeId,organizationId,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
 adminScope:null,
});
beforeEach(()=>{state.reads=0;state.filters=[];});
describe("IIT Dharwad assigned Project templates: scoped lookup and role denial",()=>{
 it("PROJ-BREAK-idor-43 exact college, nonrevoked and published predicates protect assigned list",async()=>{
  const rows=await listAssignedProjectTemplates(collegeAdmin(),collegeId);
  expect(rows).toHaveLength(1);
  const filter=new PgDialect().sqlToQuery(state.filters[0] as SQL);
  expect(filter.sql).toContain('"project_template_college_assignments"."college_id"');
  expect(filter.params).toContain(collegeId);
  expect(filter.sql).toContain('"project_template_college_assignments"."revoked_at" is null');
  expect(filter.sql).toContain('"project_templates"."status"');
  expect(filter.params).toContain("PUBLISHED");
  expect(state.reads).toBe(1);
 });
 it("PROJ-BREAK-idor-44 wrong college, learner, disabled session and bad UUID never run the query",async()=>{
  const admin=collegeAdmin();
  await expect(listAssignedProjectTemplates(admin,otherCollegeId))
   .rejects.toThrow("Missing permission: projects.manage");
  await expect(listAssignedProjectTemplates({
   ...admin,membership:{...admin.membership!,roles:["LEARNER"]},
  },collegeId)).rejects.toThrow("Missing permission: projects.manage");
  await expect(listAssignedProjectTemplates({
   ...admin,user:{...admin.user,platformStatus:"DISABLED"},
  },collegeId)).rejects.toThrow("Missing permission: projects.manage");
  await expect(listAssignedProjectTemplates(admin,"bad-id")).rejects.toThrow();
  expect(state.reads).toBe(0);
 });
 it("PROJ-BREAK-idor-45 scoped Super Admin cannot enumerate an unrelated college",async()=>{
  const admin=collegeAdmin();
  const superAdmin:RequestContext={
   ...admin,user:{...admin.user,systemRoles:["SUPER_ADMIN"]},
   membership:null,adminScope:{collegeId,organizationId},
  };
  await expect(listAssignedProjectTemplates(superAdmin,otherCollegeId))
   .rejects.toThrow("Missing permission: projects.manage");
  expect(state.reads).toBe(0);
 });
});
