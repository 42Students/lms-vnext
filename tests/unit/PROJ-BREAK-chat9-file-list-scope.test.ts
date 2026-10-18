import {beforeEach,describe,expect,it,vi} from "vitest";
import {sql} from "drizzle-orm";
import type {SQL} from "drizzle-orm";
import {PgDialect} from "drizzle-orm/pg-core";
import type {RequestContext} from "@/modules/identity/context";
import {listProjectFiles} from "@/modules/projects/project-resource-file-service";

const projectId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const state=vi.hoisted(()=>({
 access:"ADMIN" as "ADMIN"|"LEARNER",
 denied:false,selects:0,filters:[] as {kind:string;sql:unknown}[],
}));
vi.mock("@/modules/projects/access",()=>({
 requireProjectReadAccess:async(_context:unknown,id:string)=>{
  if(state.denied||id!==projectId)throw new Error("PROJECT_ACCESS_DENIED");
  return {access:state.access,project:{id:projectId},collegeId};
 },
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>{
   const kind=state.selects++===0?"outer":"linked-resource";
   const rows=[{
    id:"file-id",projectId,collegeId,resourceId:null,title:"Evidence",description:null,
    originalName:"demo.pdf",declaredContentType:"application/pdf",
    verifiedContentType:null,declaredSizeBytes:2048,verifiedSizeBytes:null,
    status:"READY",failureCode:null,createdAt:new Date("2026-10-18T10:00:00.000Z"),
    completedAt:null,objectKey:"DO_NOT_LEAK",
   }];
   const q={
    from:()=>q,
    where:(condition:unknown)=>{state.filters.push({kind,sql:condition});return q;},
    orderBy:()=>q,
    getSQL:()=>sql`select 1`,
    then:(fn:(values:typeof rows)=>unknown)=>Promise.resolve(rows).then(fn),
   };
   return q;
  },
 }),
}));
const actor:RequestContext={
 user:{id:"33333333-3333-4333-8333-333333333333",identityUid:"admin",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId},
};
const dialect=new PgDialect();
const render=(part:unknown)=>dialect.sqlToQuery(part as SQL);

beforeEach(()=>{
 state.access="ADMIN";state.denied=false;state.selects=0;state.filters=[];
});
describe("IIT Dharwad Projects file list: scoped queries and DTO projection",()=>{
 it("PROJ-BREAK-files-23 admin sees non-deleted own-college files, without storage secrets",async()=>{
  const rows=await listProjectFiles(actor,projectId);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({title:"Evidence",contentType:"application/pdf",sizeBytes:2048,status:"READY"});
  expect(rows[0]).not.toHaveProperty("objectKey");
  const where=render(state.filters[0]?.sql);
  expect(where.sql).toContain('"project_resource_files"."project_id"');
  expect(where.sql).toContain('"project_resource_files"."college_id"');
  expect(where.sql).toContain('"project_resource_files"."status"');
  expect(where.params).toContain(projectId);
  expect(where.params).toContain(collegeId);
  expect(where.params).toContain("DELETED");
 });
 it("PROJ-BREAK-files-24 learner only sees READY files linked to active TEAM resources",async()=>{
  state.access="LEARNER";
  await listProjectFiles(actor,projectId);
  const linked=state.filters.find(item=>item.kind==="linked-resource");
  expect(linked).toBeDefined();
  const inner=render(linked?.sql);
  expect(inner.sql).toContain('"project_resources"."project_id"');
  expect(inner.params).toContain(projectId);
  expect(inner.params).toContain("ACTIVE");
  expect(inner.params).toContain("TEAM");
  const outer=render(state.filters.find(item=>item.kind==="outer")?.sql);
  expect(outer.params).toContain("READY");
  expect(outer.sql).toContain("exists");
 });
 it("PROJ-BREAK-idor-46 unauthorized project UUID is denied before any file query",async()=>{
  state.denied=true;
  await expect(listProjectFiles(actor,projectId)).rejects.toThrow();
  expect(state.selects).toBe(0);
 });
});
