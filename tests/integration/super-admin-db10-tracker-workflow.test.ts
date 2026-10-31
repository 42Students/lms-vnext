import {createHash,randomUUID} from "node:crypto";
import {describe,it,expect} from "vitest";
import {Pool} from "pg";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10BugTrackerAccess,db10BugReports,db10BugReportActivities} from "@/db/schema/db10-bug-tracker";
import {getBugTrackerIssueForAdmin,listBugTrackerIssuesForAdmin,updateBugTrackerWorkflowForAdmin} from "@/modules/bug-tracker/admin-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"db10-tracker-integration",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,
};
describe.skipIf(!enabled)("DB10 tracker persisted workflow and scoped issue history (disposable PostgreSQL)",()=>{
 it("P5-R19 serializes tracker status versus root-cause and commit-field writers",async()=>{
  const db=getDb(),accessId=randomUUID(),reportId=randomUUID();
  const publicId="LMS-"+BigInt("0x"+randomUUID().replaceAll("-","").slice(0,12)).toString();
  const hash=createHash("sha256").update(randomUUID()).digest("hex");
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL!,max:4});
  const scoped={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
  await db.insert(db10BugTrackerAccess).values({
    id:accessId,displayName:"DB18 R19 Reporter",tokenHash:hash,accessRole:"REPORTER",
  });
  try{
   await db.insert(db10BugReports).values({
    id:reportId,publicId,reporterAccessId:accessId,collegeId:SEED_IDS.collegeA,
    reporterName:"DB18 R19 Reporter",accountRole:"LEARNER",environment:"UAT",
    page:"/learn",issueType:"Regression",description:"P5-R19 concurrent workflow fixture",
    severity:"MAJOR",
   });
   async function raceCurrentVersion(version:number,
     left:()=>Promise<unknown>,right:()=>Promise<unknown>){
     const holder=await pool.connect();
     let begun=false;
     try{
       await holder.query("BEGIN");
       begun=true;
       await holder.query("select id from bug_reports where id=$1 for update",[reportId]);
       // The two service writers must both reach the same FOR UPDATE row,
       // rather than relying on Promise.all with no observed overlap.
       const first=Promise.resolve().then(left).then(
         value=>({ok:true as const,value}),
         (error:unknown)=>({ok:false as const,error}),
       );
       const wait=async(n:number)=>{
         const deadline=Date.now()+12_000;
         while(Date.now()<deadline){
           const r=await pool.query<{waiting:string}>(
             "select count(*)::text as waiting from pg_stat_activity "+
             "where datname=current_database() and pid<>pg_backend_pid() "+
             "and wait_event_type='Lock' and query ilike '%bug_reports%'",
           );
           if(Number(r.rows[0]?.waiting??0)>=n)return;
           await new Promise(resolve=>setTimeout(resolve,25));
         }
         throw new Error("P5-R19: writer missed persisted report row lock");
       };
       await wait(1);
       const second=Promise.resolve().then(right).then(
         value=>({ok:true as const,value}),
         (error:unknown)=>({ok:false as const,error}),
       );
       await wait(2);
       await holder.query("COMMIT");
       begun=false;
       const [a,b]=await Promise.all([first,second]);
       expect(a.ok).toBe(true);
       expect(b).toMatchObject({ok:false,error:{code:"STALE_VERSION"}});
       const revision=await pool.query<{version:number}>(
         "select version from bug_reports where id=$1",[reportId],
       );
       expect(revision.rows).toEqual([{version:version+1}]);
     }finally{
       if(begun)await holder.query("ROLLBACK").catch(()=>undefined);
       holder.release();
     }
   }

   await raceCurrentVersion(0,
     ()=>updateBugTrackerWorkflowForAdmin(scoped,publicId,{
       expectedVersion:0,status:"FIXING",
     }),
     ()=>updateBugTrackerWorkflowForAdmin(scoped,publicId,{
       expectedVersion:0,status:"CLOSED",
     }),
   );
   let detail=await getBugTrackerIssueForAdmin(scoped,publicId);
   expect(detail.report.status).toBe("FIXING");
   expect(detail.report.version).toBe(1);
   expect(detail.activities.filter(a=>a.type==="STATUS_CHANGED")).toHaveLength(1);

   await raceCurrentVersion(1,
     ()=>updateBugTrackerWorkflowForAdmin(scoped,publicId,{
       expectedVersion:1,rootCause:"P5-R19 concurrent persisted root cause",
     }),
     ()=>updateBugTrackerWorkflowForAdmin(scoped,publicId,{
       expectedVersion:1,frontendCommitSha:"a".repeat(40),fixNotes:"Should be rejected as stale",
     }),
   );
   detail=await getBugTrackerIssueForAdmin(scoped,publicId);
   expect(detail.report.version).toBe(2);
   expect(detail.report.rootCause).toBe("P5-R19 concurrent persisted root cause");
   expect(detail.report.frontendCommitSha).toBeNull();
   const audited=await pool.query<{event_type:string}>(
     "select activity_type as event_type from bug_report_activities where bug_report_id=$1 order by created_at,id",
     [reportId],
   );
   expect(audited.rows.length).toBeGreaterThanOrEqual(2);
  }finally{
   await db.delete(db10BugReportActivities).where(eq(db10BugReportActivities.bugReportId,reportId));
   await db.delete(db10BugReports).where(eq(db10BugReports.id,reportId));
   await db.delete(db10BugTrackerAccess).where(eq(db10BugTrackerAccess.id,accessId));
   await pool.end();
  }
 },60_000);

 it("tracks a scoped issue, appends activity and refuses stale/out-of-scope writes",async()=>{
  const db=getDb(),accessId=randomUUID(),reportId=randomUUID();
  const publicId="LMS-"+BigInt("0x"+randomUUID().replaceAll("-","").slice(0,12)).toString();
  const hash=createHash("sha256").update(randomUUID()).digest("hex");
  await db.insert(db10BugTrackerAccess).values({id:accessId,displayName:"DB10 Test Reporter",tokenHash:hash,accessRole:"REPORTER"});
  try{
   await db.insert(db10BugReports).values({
    id:reportId,publicId,reporterAccessId:accessId,collegeId:SEED_IDS.collegeA,
    reporterName:"DB10 Test Reporter",accountRole:"LEARNER",environment:"UAT",
    page:"/learn",issueType:"Regression",description:"Integration workflow fixture",
    severity:"MAJOR",
   });
   const scoped={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
   const rows=await listBugTrackerIssuesForAdmin(scoped,{q:publicId,limit:50});
   expect(rows.items.map(item=>item.id)).toContain(reportId);
   const byWorkflow=await listBugTrackerIssuesForAdmin(scoped,{
    q:publicId,accountRole:"LEARNER",resolution:"UNRESOLVED",
    retestStatus:"NOT_RETESTED",productionVerified:false,limit:50,
   });
   expect(byWorkflow.items.map(item=>item.id)).toContain(reportId);
   const checkedOnly=await listBugTrackerIssuesForAdmin(scoped,{q:publicId,productionVerified:true,limit:50});
   expect(checkedOnly.items.map(item=>item.id)).not.toContain(reportId);
   const facultyOnly=await listBugTrackerIssuesForAdmin(scoped,{q:publicId,accountRole:"FACULTY",limit:50});
   expect(facultyOnly.items.map(item=>item.id)).not.toContain(reportId);
   const before=await getBugTrackerIssueForAdmin(scoped,publicId);
   expect(before.report.version).toBe(0);
   const after=await updateBugTrackerWorkflowForAdmin(scoped,publicId,{expectedVersion:0,status:"FIXING"});
   expect(after.status).toBe("FIXING");
   const fixingOnly=await listBugTrackerIssuesForAdmin(scoped,{q:publicId,status:"FIXING",limit:50});
   expect(fixingOnly.items.map(item=>item.id)).toContain(reportId);
   expect(after.version).toBe(1);
   const detail=await getBugTrackerIssueForAdmin(scoped,publicId);
   expect(detail.activities.some(event=>event.type==="STATUS_CHANGED")).toBe(true);
   await expect(updateBugTrackerWorkflowForAdmin(scoped,publicId,{expectedVersion:0,status:"CLOSED"}))
    .rejects.toMatchObject({code:"STALE_VERSION"});
   await expect(getBugTrackerIssueForAdmin({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}},publicId))
    .rejects.toMatchObject({code:"ISSUE_NOT_FOUND"});
   await expect(getBugTrackerIssueForAdmin({...admin,user:{...admin.user,systemRoles:[]}},publicId))
    .rejects.toMatchObject({code:"FORBIDDEN"});
  }finally{
   await db.delete(db10BugReportActivities).where(eq(db10BugReportActivities.bugReportId,reportId));
   await db.delete(db10BugReports).where(eq(db10BugReports.id,reportId));
   await db.delete(db10BugTrackerAccess).where(eq(db10BugTrackerAccess.id,accessId));
  }
 });
});
