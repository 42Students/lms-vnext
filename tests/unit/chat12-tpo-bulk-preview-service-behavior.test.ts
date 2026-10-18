import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {verifyTpoBulkPreview} from "@/modules/placements/tpo-bulk-preview-token";
import {tpoBulkStudentVersion} from "@/modules/placements/tpo-bulk-decision-model";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";

const mock=vi.hoisted(()=>({
 college:vi.fn(),actor:vi.fn(),db:vi.fn(),tx:vi.fn(),read:vi.fn(),
 stages:vi.fn(),notes:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/auth/config",()=>({getAuthConfig:()=>({secret:"fake-secret-never-deploy"})}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({
 requireTpoJobCollege:mock.college,requireTpoJobActor:mock.actor,
}));
vi.mock("@/modules/placements/tpo-participation-service",()=>({
 getTpoLearnerParticipation:mock.read,
}));
vi.mock("@/modules/placements/tpo-bulk-application-stage-service",()=>({
 loadTpoBulkApplicationStages:mock.stages,
}));
vi.mock("@/modules/placements/applicant-notes-service",()=>({
 listTpoApplicantNotes:mock.notes,
}));
import {loadTpoBulkCurrent,previewTpoBulkAction}
 from "@/modules/placements/tpo-bulk-action-preview-service";

const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const COLLEGE="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ORG="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ctx:RequestContext={
 user:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",identityUid:"tpo",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"ffffffff-ffff-4fff-8fff-ffffffffffff",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};
const directA={status:null,reason:null,note:null,updatedAt:null};
const directB={status:"ELIGIBLE" as const,reason:null,note:null,updatedAt:null};
const plan=tpoBulkPreviewRequestSchema.parse({
 target:"STUDENTS",ids:[A,B],action:"ELIGIBLE",note:"",
});

describe("TPO-students-14 actual preview service signed authorization and row readiness",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.college.mockResolvedValue(COLLEGE);
  mock.actor.mockResolvedValue(undefined);
  mock.tx.mockImplementation(async(fn:(tx:object)=>Promise<unknown>)=>fn({}));
  mock.db.mockReturnValue({transaction:mock.tx});
  mock.read.mockImplementation(async(_ctx:RequestContext,id:string)=>({
   direct:id===A?directA:directB,
  }));
 });
 it("signs only the authorized caller, exact row order, no-op rows and immutable versions",async()=>{
  const result=await previewTpoBulkAction(ctx,plan);
  expect(result.counts).toEqual({ready:1,skipped:1});
  expect(result.rows.map(x=>x.status)).toEqual(["ready","skipped"]);
  expect(result.rows.map(x=>x.version)).toEqual([
   tpoBulkStudentVersion(directA),tpoBulkStudentVersion(directB),
  ]);
  const selections=result.rows.map(row=>({id:row.id,version:row.version}));
  const actor=ctx.user.id+":"+ctx.membership!.id;
  expect(verifyTpoBulkPreview("fake-secret-never-deploy",actor,plan,
   selections,result.previewToken)).toBe(true);
  expect(verifyTpoBulkPreview("fake-secret-never-deploy",
   ctx.user.id+":another-membership",plan,selections,result.previewToken)).toBe(false);
  expect(mock.read).toHaveBeenCalledTimes(2);
  expect(mock.actor).toHaveBeenCalledTimes(1);
 });
 it("revoked persisted TPO membership denies preview before reading any student evidence",async()=>{
  mock.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(previewTpoBulkAction(ctx,plan)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.read).not.toHaveBeenCalled();
 });
 it("unrecognized or foreign-student ID produces a skipped row with no fake version",async()=>{
  mock.read.mockImplementation(async(_ctx:RequestContext,id:string)=>{
   if(id===B)throw new AuthorizationError("placements.manage");
   return {direct:directA};
  });
  const result=await previewTpoBulkAction(ctx,plan);
  expect(result.rows[0].status).toBe("ready");
  expect(result.rows[1].status).toBe("skipped");
  expect(result.rows[1].version).toBe("unavailable");
  expect(result.counts).toMatchObject({ready:1,skipped:1});
 });
 it("invalid action, duplicate IDs and forged job scope fail validation without DB access",async()=>{
  for(const input of [
   {...plan,ids:[A,A]},
   {...plan,jobId:B},
   {...plan,action:"MOVE_TEST"},
   {...plan,ids:[]},
  ]){
   await expect(previewTpoBulkAction(ctx,input)).rejects.toBeDefined();
  }
  expect(mock.db).not.toHaveBeenCalled();
  expect(mock.read).not.toHaveBeenCalled();
 });
 it("direct bulk-current reader also fails on revoked actor rather than returning an empty success",async()=>{
  mock.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(loadTpoBulkCurrent(ctx,plan)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.read).not.toHaveBeenCalled();
 });
 it("bounds 200-row preview lookups to eight concurrent scoped reads without reordering the signed rows",async()=>{
  const ids=Array.from({length:21},(_,i)=>
   "aaaaaaaa-aaaa-4aaa-8aaa-"+i.toString(16).padStart(12,"0"));
  let active=0,peak=0;
  mock.read.mockImplementation(async()=>{
   active+=1;peak=Math.max(peak,active);
   await Promise.resolve();
   active-=1;
   return {direct:directA};
  });
  const result=await previewTpoBulkAction(ctx,{target:"STUDENTS",ids,
   action:"ELIGIBLE",note:""});
  expect(mock.read).toHaveBeenCalledTimes(ids.length);
  expect(peak).toBe(8);
  expect(active).toBe(0);
  expect(result.rows.map(row=>row.id)).toEqual(ids);
  expect(result.counts).toEqual({ready:21,skipped:0});
 });

 it("TPO-students-14 actor SHARE locks never run inside a PostgreSQL READ ONLY transaction",async()=>{
  const {readFileSync}=await import("node:fs");
  const {resolve}=await import("node:path");
  const sourcePaths=[
   "src/modules/placements/tpo-bulk-action-preview-service.ts",
   "src/modules/placements/tpo-bulk-application-stage-service.ts",
  ];
  for(const path of sourcePaths){
   const source=readFileSync(resolve(process.cwd(),path),"utf8");
   expect(source).toContain("requireTpoJobActor(tx,");
   expect(source).not.toContain('{accessMode:"read only"}');
  }
  const actorSource=readFileSync(resolve(process.cwd(),
   "src/modules/placements/tpo-job-write-base.ts"),"utf8");
  expect(actorSource).toContain('.for("share").limit(1)');
 });

});
