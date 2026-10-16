import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoDriveLifecycleList} from "@/modules/placements/tpo-drive-lifecycle-list-service";
import {decideTpoRecruiterDriveRequest} from "@/modules/placements/tpo-drive-request-decision-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB12_ISOLATED_TEST_DATABASE==="1" &&
  !!process.env.TEST_DATABASE_URL &&
  process.env.TEST_DATABASE_URL===process.env.DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={
  user:{id:SEED_IDS.facultyUser,identityUid:"seed-tpo",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
const fixture={company:randomUUID(),relationship:randomUUID(),request:randomUUID(),
  submission:randomUUID(),relationshipB:randomUUID(),requestB:randomUUID()};
let grantedTpoRole=false;
const jobs:string[]=[];
async function cleanup(){
  if(!pool)return;
  await pool.query("DELETE FROM in_app_notifications WHERE event_id IN (SELECT id FROM activity_events WHERE subject_id=$1)",[fixture.request]);
  await pool.query("DELETE FROM activity_events WHERE subject_id=$1",[fixture.request]);
  await pool.query("DELETE FROM placement_recruiter_drive_requests WHERE id=ANY($1::uuid[])",[[fixture.request,fixture.requestB]]);
  for(const id of jobs){
    await pool.query("DELETE FROM placement_job_eligibility_policies WHERE job_id=$1",[id]);
    await pool.query("DELETE FROM placement_job_rounds WHERE job_id=$1",[id]);
    await pool.query("DELETE FROM placement_job_role_options WHERE job_id=$1",[id]);
    await pool.query("DELETE FROM placement_jobs WHERE id=$1",[id]);
  }
  await pool.query("DELETE FROM placement_company_relationships WHERE id=ANY($1::uuid[])",[[fixture.relationship,fixture.relationshipB]]);
  if(grantedTpoRole)await pool.query("DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",[SEED_IDS.facultyCollegeAMembership]);
  await pool.query("DELETE FROM placement_companies WHERE id=$1",[fixture.company]);
}
describe.skipIf(!enabled)("TPO-drives-02 TPO-requests-verification-33 on registered 0101 PostgreSQL",()=>{
  afterAll(async()=>{await cleanup();await pool?.end();await closeDatabaseConnection();});
  it("lists only current-college recruiter approval requests and never treats drafts as requests",async()=>{
    if(!pool)throw new Error("Disposable PostgreSQL required");
    // The seed faculty membership has no TPO role row; the TPO actor check reads membership_roles.
    const granted=await pool.query(
      "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
      [SEED_IDS.facultyCollegeAMembership]);
    grantedTpoRole=(granted.rowCount??0)>0;
    await pool.query(
      "INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)",
      [fixture.company,"Request Company "+fixture.company,SEED_IDS.facultyUser],
    );
    await pool.query(
      "INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)",
      [fixture.relationship,SEED_IDS.collegeA,fixture.company,SEED_IDS.facultyUser],
    );
    await pool.query(
      "INSERT INTO placement_recruiter_drive_requests(id,college_id,company_relationship_id,recruiter_user_id,submission_id,status,draft) VALUES($1,$2,$3,$4,$5,'REQUEST',$6::jsonb)",
      [fixture.request,SEED_IDS.collegeA,fixture.relationship,SEED_IDS.facultyUser,
        fixture.submission,JSON.stringify({title:"Candidate Hiring Request"})],
    );
    const list=await getTpoDriveLifecycleList(tpo,{view:"REQUESTS",search:"Candidate Hiring"});
    expect(list.requestsAvailable).toBe(true);
    expect(list.requestRows).toEqual(expect.arrayContaining([
      expect.objectContaining({id:fixture.request,status:"REQUEST",title:"Candidate Hiring Request"}),
    ]));
    // A request in another college must never appear in this TPO's queue.
    await pool.query(
      "INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)",
      [fixture.relationshipB,SEED_IDS.collegeB,fixture.company,SEED_IDS.facultyUser],
    );
    await pool.query(
      "INSERT INTO placement_recruiter_drive_requests(id,college_id,company_relationship_id,recruiter_user_id,submission_id,status,draft) VALUES($1,$2,$3,$4,$5,'REQUEST',$6::jsonb)",
      [fixture.requestB,SEED_IDS.collegeB,fixture.relationshipB,SEED_IDS.facultyUser,
        randomUUID(),JSON.stringify({title:"Candidate Hiring Request B"})],
    );
    const own=await getTpoDriveLifecycleList(tpo,{view:"REQUESTS"});
    expect(own.requestRows.some(row=>row.id===fixture.requestB)).toBe(false);
    await pool.query(
      "UPDATE placement_recruiter_drive_requests SET status='DRAFT' WHERE id=$1",
      [fixture.request],
    );
    const draft=await getTpoDriveLifecycleList(tpo,{view:"REQUESTS"});
    expect(draft.requestRows.some(row=>row.id===fixture.request&&row.status==="DRAFT")).toBe(true);
  });

  it("TPO-requests-verification-34/35 approves a real draft once and rejects stale decisions",async()=>{
    if(!pool)throw new Error("Isolated PostgreSQL required");
    await pool.query(
      "UPDATE placement_recruiter_drive_requests SET status='REQUEST',approved_job_id=null,decided_by_user_id=null,decided_at=null,decision_note=null,draft=$2::jsonb WHERE id=$1",
      [fixture.request,JSON.stringify({
        title:"Graduate Engineer",description:"Build and test applications for campus placements",
        location:"Hyderabad",employmentType:"FULL_TIME",workMode:"ONSITE",
        minimumAnnualCtcInr:"600000",maximumAnnualCtcInr:"900000",
        minimumCgpa:"7.0",fixedAnnualCtcInr:"",variableAnnualCtcInr:"",
        bondMonths:"",bondAmountInr:"",maximumActiveBacklogs:"",
        rounds:[{kind:"INTERVIEW",name:"Technical interview"}],
      })],
    );
    const decision=await decideTpoRecruiterDriveRequest(tpo,fixture.request,{
      action:"APPROVE_LATER",expectedStatus:"REQUEST",
      reason:"Approved for drafting",confirmed:true,
    });
    expect(decision.status).toBe("DRAFT");
    expect(decision.emailSent).toBe(false);
    expect(decision.approvedJobId).toBeTruthy();
    jobs.push(decision.approvedJobId!);
    const job=await pool.query("SELECT status FROM placement_jobs WHERE id=$1",
      [decision.approvedJobId]);
    expect(job.rows[0].status).toBe("DRAFT");
    const rounds=await pool.query("SELECT name FROM placement_job_rounds WHERE job_id=$1",
      [decision.approvedJobId]);
    expect(rounds.rows).toHaveLength(1);
    await expect(decideTpoRecruiterDriveRequest(tpo,fixture.request,{
      action:"DECLINE",expectedStatus:"REQUEST",
      reason:"The request was already approved",confirmed:true,
    })).rejects.toMatchObject({code:"REQUEST_STALE"});
  });

});
