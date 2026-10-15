import {createHash,randomUUID} from "node:crypto";
import {describe,it,expect} from "vitest";
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
