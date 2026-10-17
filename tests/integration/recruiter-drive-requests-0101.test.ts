import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {createOwnRecruiterDriveRequest,listOwnRecruiterDriveRequests,
 updateOwnRecruiterDriveRequest,RecruiterDriveRequestError}
 from "@/modules/placements/recruiter-drive-request-service";
import {getTpoDriveLifecycleList} from "@/modules/placements/tpo-drive-lifecycle-list-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB12_ISOLATED_TEST_DATABASE==="1" &&
 Boolean(process.env.TEST_DATABASE_URL) &&
 process.env.TEST_DATABASE_URL===process.env.DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const id={user:randomUUID(),company:randomUUID(),relationship:randomUUID(),
 grant:randomUUID(),request:randomUUID().toString(),nonce:randomUUID()};
let addedTpoRole=false;
const recruiter:RequestContext={
 user:{id:id.user,identityUid:"test-recruiter-0101",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:id.user,companyId:id.company,companyName:"Test employer",
  title:null,status:"ACTIVE",grants:[{id:id.grant,organizationId:SEED_IDS.organization,
    collegeId:SEED_IDS.collegeA,collegeName:"College A",companyRelationshipId:id.relationship}]},
};
const tpo:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
   organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
const draft={
 title:"Graduate Data Analyst",
 description:"Entry level analytics role building data pipelines and dashboards",
 location:"Hyderabad",employmentType:"FULL_TIME",workMode:"ONSITE",
 minimumAnnualCtcInr:"600000",maximumAnnualCtcInr:"900000",
 fixedAnnualCtcInr:"",variableAnnualCtcInr:"",
 bondMonths:"",bondAmountInr:"",minimumCgpa:"7.0",maximumActiveBacklogs:"",
 rounds:[{kind:"INTERVIEW" as const,name:"Technical interview"}],
};
async function setup(){
 if(!pool)throw new Error("Disposable PostgreSQL required");
 const token=randomUUID();
 await pool.query("insert into users(id,identity_uid,email,display_name) values($1,$2,$3,$4)",
  [id.user,"recruiter-request:"+token,token+"@example.test","Recruiter"]);
 await pool.query("insert into placement_companies(id,name,created_by_user_id) values($1,$2,$3)",
  [id.company,"Recruiter Request "+token,SEED_IDS.facultyUser]);
 await pool.query("insert into placement_company_relationships(id,college_id,company_id,created_by_user_id) values($1,$2,$3,$4)",
  [id.relationship,SEED_IDS.collegeA,id.company,SEED_IDS.facultyUser]);
 await pool.query("insert into placement_recruiter_profiles(user_id,company_id,created_by_user_id) values($1,$2,$3)",
  [id.user,id.company,SEED_IDS.facultyUser]);
 await pool.query(`insert into placement_recruiter_college_grants
  (id,recruiter_user_id,company_relationship_id,granted_by_user_id,valid_until,verification_status,capabilities)
  values($1,$2,$3,$4,now()+interval '6 months','VERIFIED',ARRAY['DRIVES']::text[])`,
  [id.grant,id.user,id.relationship,SEED_IDS.facultyUser]);
 const role=await pool.query("insert into membership_roles(membership_id,role) values($1,'TPO') on conflict do nothing",
  [SEED_IDS.facultyCollegeAMembership]);
 addedTpoRole=(role.rowCount??0)>0;
}
async function cleanup(){
 if(!pool)return;
 await pool.query("delete from in_app_notifications where event_id in (select id from activity_events where subject_id=$1)",[id.request]);
 await pool.query("delete from activity_events where subject_id=$1",[id.request]);
 await pool.query("delete from placement_recruiter_drive_requests where recruiter_user_id=$1",[id.user]);
 await pool.query("delete from placement_recruiter_college_grants where id=$1",[id.grant]);
 await pool.query("delete from placement_recruiter_profiles where user_id=$1",[id.user]);
 await pool.query("delete from placement_company_relationships where id=$1",[id.relationship]);
 await pool.query("delete from placement_companies where id=$1",[id.company]);
 await pool.query("delete from users where id=$1",[id.user]);
 if(addedTpoRole)await pool.query("delete from membership_roles where membership_id=$1 and role='TPO'",
   [SEED_IDS.facultyCollegeAMembership]);
}
describe.skipIf(!enabled)("REC-home-drives-21/12/22 recruiter requests on real migration 0101",()=>{
 afterAll(async()=>{await cleanup();await pool?.end();await closeDatabaseConnection();});
 it("saves one request, shows in TPO inbox, replays nonce and resubmits sent-back changes",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL required");
  await setup();
  const input={collegeId:SEED_IDS.collegeA,submissionId:id.nonce,draft};
  const first=await createOwnRecruiterDriveRequest(recruiter,input);
  id.request=first.request.id;
  expect(first.request.status).toBe("REQUEST");
  const replay=await createOwnRecruiterDriveRequest(recruiter,input);
  expect(replay.replayed).toBe(true);
  expect(replay.request.id).toBe(first.request.id);
  const own=await listOwnRecruiterDriveRequests(recruiter,SEED_IDS.collegeA);
  expect(own.map(item=>item.id)).toContain(first.request.id);
  const cell=await getTpoDriveLifecycleList(tpo,{view:"REQUESTS"});
  expect(cell.requestRows.map(item=>item.id)).toContain(first.request.id);
  const messages=await pool.query<{title:string}>(`select n.title from in_app_notifications n
   join activity_events e on e.id=n.event_id where e.subject_id=$1`,[id.request]);
  expect(messages.rows.map(row=>row.title)).toContain("New drive request from Test employer");

  await expect(createOwnRecruiterDriveRequest(recruiter,{
   ...input,draft:{...draft,title:"Other role"},
  })).rejects.toMatchObject({code:"IDEMPOTENCY_CONFLICT"});

  const edited=await updateOwnRecruiterDriveRequest(recruiter,{
   requestId:id.request,collegeId:SEED_IDS.collegeA,action:"EDIT",
   expectedUpdatedAt:first.request.updatedAt.toISOString(),
   draft:{...draft,title:"Graduate Data Analyst II"},
  });
  expect(edited.status).toBe("REQUEST");
  expect((edited.draft as {title:string}).title).toBe("Graduate Data Analyst II");
  await expect(updateOwnRecruiterDriveRequest(recruiter,{
   requestId:id.request,collegeId:SEED_IDS.collegeA,action:"EDIT",
   expectedUpdatedAt:first.request.updatedAt.toISOString(),
   draft:{...draft,title:"Should be rejected"},
  })).rejects.toMatchObject({code:"STALE"});
  await pool.query(`update placement_recruiter_drive_requests set status='SENT_BACK',
   decision_note='Please correct the role title',updated_at=now() where id=$1`,[id.request]);
  const [sentBack]=await listOwnRecruiterDriveRequests(recruiter,SEED_IDS.collegeA);
  expect(sentBack.status).toBe("SENT_BACK");
  expect(sentBack.decisionNote).toContain("role title");
  const updated=await updateOwnRecruiterDriveRequest(recruiter,{
   requestId:id.request,collegeId:SEED_IDS.collegeA,action:"RESUBMIT",
   expectedUpdatedAt:sentBack.updatedAt.toISOString(),
   draft:{...draft,title:"Data Analyst"},
  });
  expect(updated.status).toBe("REQUEST");
  expect((updated.draft as {title:string}).title).toBe("Data Analyst");
  await expect(updateOwnRecruiterDriveRequest(recruiter,{
   requestId:id.request,collegeId:SEED_IDS.collegeA,action:"CANCEL",
   expectedUpdatedAt:sentBack.updatedAt.toISOString(),
  })).rejects.toBeInstanceOf(RecruiterDriveRequestError);
 });
 it("denies tenant and employer grants not owned by this recruiter",async()=>{
  await expect(listOwnRecruiterDriveRequests({
   ...recruiter,recruiter:{...recruiter.recruiter!,companyId:randomUUID()},
  },SEED_IDS.collegeA)).rejects.toMatchObject({code:"FORBIDDEN"});
  await expect(createOwnRecruiterDriveRequest(recruiter,{
   collegeId:SEED_IDS.collegeB,submissionId:randomUUID(),draft,
  })).rejects.toMatchObject({code:"FORBIDDEN"});
 });
});
