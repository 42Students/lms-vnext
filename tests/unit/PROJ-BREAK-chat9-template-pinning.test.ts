import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";
import {getAssignedProjectTemplateDetail} from "@/modules/projects/template-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const otherId="22222222-2222-4222-8222-222222222222";
const orgId="33333333-3333-4333-8333-333333333333";
const templateId="44444444-4444-4444-8444-444444444444";
const state=vi.hoisted(()=>({
 reads:0,assigned:true,joins:[] as unknown[],filters:[] as unknown[],
}));
vi.mock("@/modules/projects/scope",()=>({
 loadProjectCollegeScope:async(id:string)=>({
  id,organizationId:id===otherId?"55555555-5555-4555-8555-555555555555":orgId,
 }),
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>{
   state.reads+=1;
   const q={
    from:()=>q,
    innerJoin:(_table:unknown,predicate:unknown)=>{state.joins.push(predicate);return q;},
    where:(predicate:unknown)=>{state.filters.push(predicate);return q;},
    limit:async()=>state.assigned?[{
     assignment:{id:"assignment"},template:{id:templateId,status:"PUBLISHED"},
     version:{id:"version",templateId,version:3},
    }]:[],
   };
   return q;
  },
 }),
}));
const actor=():RequestContext=>({
 user:{id:"66666666-6666-4666-8666-666666666666",identityUid:"admin",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"77777777-7777-4777-8777-777777777777",
  collegeId,organizationId:orgId,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
 adminScope:null,
});
const dialect=new PgDialect();
const sqlText=(value:unknown)=>dialect.sqlToQuery(value as SQL);
beforeEach(()=>{state.reads=0;state.assigned=true;state.joins=[];state.filters=[];});
describe("IIT Dharwad assigned template historical version pinning and scope",()=>{
 it("PROJ-BREAK-idor-47 only an assigned published template and owner-matched version can resolve",async()=>{
  const row=await getAssignedProjectTemplateDetail(actor(),collegeId,templateId);
  expect(row.version.version).toBe(3);
  const pins=state.joins.map(sqlText);
  expect(pins.some(q=>q.sql.includes('"project_template_versions"."template_id"')&&
   q.sql.includes('"project_template_college_assignments"."template_id"'))).toBe(true);
  const filter=sqlText(state.filters[0]);
  expect(filter.params).toContain(collegeId);
  expect(filter.params).toContain(templateId);
  expect(filter.params).toContain("PUBLISHED");
  expect(filter.sql).toContain('"project_template_college_assignments"."revoked_at" is null');
 });
 it("PROJ-BREAK-idor-48 cross-college, learner and disabled role deny before query",async()=>{
  const admin=actor();
  await expect(getAssignedProjectTemplateDetail(admin,otherId,templateId))
   .rejects.toThrow("Missing permission: projects.manage");
  await expect(getAssignedProjectTemplateDetail({
   ...admin,membership:{...admin.membership!,roles:["LEARNER"]},
  },collegeId,templateId)).rejects.toThrow("Missing permission: projects.manage");
  await expect(getAssignedProjectTemplateDetail({
   ...admin,user:{...admin.user,platformStatus:"DISABLED"},
  },collegeId,templateId)).rejects.toThrow("Missing permission: projects.manage");
  expect(state.reads).toBe(0);
 });
 it("PROJ-BREAK-state-25 never-assigned or revoked template is not leaked by guessed ID",async()=>{
  state.assigned=false;
  await expect(getAssignedProjectTemplateDetail(actor(),collegeId,templateId))
   .rejects.toThrow("PROJECT_TEMPLATE_NOT_ASSIGNED");
  expect(state.reads).toBe(1);
 });
});
