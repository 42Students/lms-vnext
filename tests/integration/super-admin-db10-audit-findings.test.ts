import {randomBytes,randomInt,randomUUID} from "node:crypto";
import {and,eq} from "drizzle-orm";
import {describe,expect,it} from "vitest";
import {getDb} from "@/db/client";
import {db10BugTrackerAccess,db10BugReports,db10BugReportActivities} from "@/db/schema/db10-bug-tracker";
import {listBugTrackerIssuesForAdmin,getBugTrackerIssueForAdmin,updateBugTrackerWorkflowForAdmin,retestBugTrackerIssueForAdmin} from "@/modules/bug-tracker/admin-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"tracker-integration",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null};
describe.skipIf(!enabled)("DB10 real audit finding list detail and status lifecycle",()=>{
 it("scopes a seeded issue and records versioned status/retest audit events",async()=>{
  const db=getDb(),accessId=randomUUID(),reportId=randomUUID(),publicId="LMS-"+randomInt(100000,999999);
  await db.insert(db10BugTrackerAccess).values({id:accessId,displayName:"Isolated Reporter",tokenHash:randomBytes(32).toString("hex"),accessRole:"REPORTER"});
  try{
   await db.insert(db10BugReports).values({id:reportId,publicId,reporterAccessId:accessId,
    reporterName:"Isolated Reporter",accountRole:"LEARNER",environment:"UAT",collegeId:SEED_IDS.collegeA,
    page:"/learn/dashboard",issueType:"Navigation",description:"Test-only DB10 issue",severity:"MAJOR"});
   const scoped={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA}};
   const rows=await listBugTrackerIssuesForAdmin(scoped,{q:publicId,environment:"UAT",limit:50});
   expect(rows.items.some(row=>row.publicId===publicId)).toBe(true);
   const detail=await getBugTrackerIssueForAdmin(scoped,publicId);
   expect(detail.report.version).toBe(0);
   const first=await updateBugTrackerWorkflowForAdmin(scoped,publicId,{expectedVersion:0,status:"CHECKING"});
   expect(first.status).toBe("CHECKING");
   await expect(updateBugTrackerWorkflowForAdmin(scoped,publicId,{expectedVersion:0,status:"FIXING"})).rejects.toBeDefined();
   const second=await updateBugTrackerWorkflowForAdmin(scoped,publicId,{expectedVersion:1,status:"READY_FOR_RETEST"});
   expect(second.status).toBe("READY_FOR_RETEST");
   const last=await retestBugTrackerIssueForAdmin(scoped,publicId,{expectedVersion:2,result:"PASS",note:"Verified in disposable database"});
   expect(last.status).toBe("CLOSED");
   const audit=await db.select({id:db10BugReportActivities.id}).from(db10BugReportActivities).where(eq(db10BugReportActivities.bugReportId,reportId));
   expect(audit.length).toBeGreaterThanOrEqual(3);
   await expect(getBugTrackerIssueForAdmin({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}},publicId)).rejects.toBeDefined();
  }finally{
   await db.delete(db10BugReportActivities).where(eq(db10BugReportActivities.bugReportId,reportId));
   await db.delete(db10BugReports).where(eq(db10BugReports.id,reportId));
   await db.delete(db10BugTrackerAccess).where(eq(db10BugTrackerAccess.id,accessId));
  }
 });
});