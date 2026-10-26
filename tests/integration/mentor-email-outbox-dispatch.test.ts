import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {runMentorProjectEmailDispatchBatch} from
 "@/modules/projects/mentor-project-email-dispatch-worker";
import {SEED_IDS} from "../../scripts/db-seed-data";

if(!process.env.TEST_DATABASE_URL)
 throw new Error("Mentor outbox tests require disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const sourceId=randomUUID(),jobId=randomUUID(),submissionId=randomUUID();
const projectId=randomUUID();
const stalledJobIds=Array.from({length:12},()=>randomUUID());
const retryJobId=randomUUID(),retryReceiptId=randomUUID();
const stalledReceiptIds=Array.from({length:12},()=>randomUUID());
const setupAt=new Date();
afterAll(async()=>{
 try{
  await pool.query(`delete from activity_events where
    subject_type='mentor_project_email_dispatch_receipt'
      and subject_id=any($1::text[])`,[[jobId,retryJobId,...stalledJobIds]]);
  await pool.query("delete from activity_events where id=any($1::uuid[])",
   [[jobId,sourceId,retryJobId,...stalledJobIds]]);
 }finally{await pool.end();await closeDatabaseConnection();}
});
describe("Mentor claimed email outbox PostgreSQL transaction",()=>{
 it("suppresses forged cross-college queued source without provider I/O and cannot reprocess it",async()=>{
  const foreign=await pool.query<{organization_id:string}>(`
    select organization_id from colleges where id=$1`,[SEED_IDS.collegeB]);
  const orgB=foreign.rows[0]?.organization_id;
  expect(orgB).toBeTruthy();
  // Durable source lives in College B. An unrelated College A queue
  // must not be able to transform this event into an email, even when its
  // source and recipient UUIDs look valid.
  await pool.query(`insert into activity_events
    (id,organization_id,college_id,actor_user_id,module,event_type,
     subject_type,subject_id,summary,metadata)
    values ($1,$2,$3,$4,'PROJECTS',$5,'project_submission',$6,
     'Foreign college delivery event',$7::jsonb)`,[
    sourceId,orgB,SEED_IDS.collegeB,SEED_IDS.collegeAdminUser,
    ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_SUBMITTED,submissionId,
    JSON.stringify({projectId}),
  ]);
  // Twelve older jobs have active claim leases or fresh RETRY cooldowns.
  // A naive LIMIT 10 on all queued jobs would starve the new eligible job.
  // These state receipts model a worker claim but cannot send email.
  await pool.query(`insert into activity_events
   (id,organization_id,college_id,actor_user_id,module,event_type,
    subject_type,subject_id,summary,metadata,occurred_at)
   select old.id,$2,$3,$4,'PROJECTS',$5,'mentor_project_email_job',$6,
     'Still leased or cooling down', $7::jsonb,
     clock_timestamp()-interval '30 seconds'
   from unnest($1::uuid[]) as old(id)`,[
    stalledJobIds,SEED_IDS.organization,SEED_IDS.collegeA,
    SEED_IDS.collegeAdminUser,
    ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_QUEUED,sourceId,
    JSON.stringify({sourceEventId:sourceId,recipientUserId:SEED_IDS.facultyUser,
     projectId,kind:"FINAL_SUBMISSION"}),
  ]);
  await pool.query(`insert into activity_events
   (id,organization_id,college_id,actor_user_id,module,event_type,
    subject_type,subject_id,summary,metadata,occurred_at)
   select receipt.id,$4,$5,$6,'PROJECTS',$7,
     'mentor_project_email_dispatch_receipt',receipt.job::text,
     'Unexpired worker lease or retry backoff',
     jsonb_build_object('status',receipt.state,'attempt',1),
     clock_timestamp()-interval '1 second'
   from unnest($1::uuid[],$2::uuid[],$3::text[])
    as receipt(id,job,state)`,[
    stalledReceiptIds,stalledJobIds,
    stalledJobIds.map((_,index)=>index<6?"CLAIMED":"RETRY"),
    SEED_IDS.organization,SEED_IDS.collegeA,SEED_IDS.collegeAdminUser,
    ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_DISPATCH_STATE,
  ]);
  await pool.query(`insert into activity_events
    (id,organization_id,college_id,actor_user_id,module,event_type,
     subject_type,subject_id,summary,metadata)
    values ($1,$2,$3,$4,'PROJECTS',$5,'mentor_project_email_job',$6,
     'Forged cross-college queue',$7::jsonb)`,[
    jobId,SEED_IDS.organization,SEED_IDS.collegeA,SEED_IDS.collegeAdminUser,
    ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_QUEUED,sourceId,
    JSON.stringify({sourceEventId:sourceId,recipientUserId:SEED_IDS.facultyUser,
      projectId,kind:"FINAL_SUBMISSION"}),
  ]);
  const ready={
   MENTOR_PROJECT_EMAIL_OUTBOX_READY:"verified",
   MENTOR_PROJECT_EMAIL_DISPATCH_READY:"verified",
   ZEPTOMAIL_IDEMPOTENCY_SUPPORTED:"confirmed",
   MENTOR_PROJECT_EMAIL_ACTIVATED_AT:new Date(setupAt.getTime()-60000).toISOString(),
  };
  const first=await runMentorProjectEmailDispatchBatch(ready);
  expect(first.status).toBe("CHECKED");
  expect(first.suppressed).toBeGreaterThanOrEqual(1);
  const receipts=await pool.query<{status:string;attempt:number}>(`
   select metadata->>'status' as status,
     (metadata->>'attempt')::integer as attempt
   from activity_events
   where subject_type='mentor_project_email_dispatch_receipt'
     and subject_id=$1
   order by occurred_at,id`,[jobId]);
  expect(receipts.rows.map(x=>x.status)).toEqual(["CLAIMED","SUPPRESSED"]);
  expect(receipts.rows.map(x=>x.attempt)).toEqual([1,1]);
  const stillLeased=await pool.query<{n:string}>(`
   select count(*)::text as n from activity_events
   where subject_type='mentor_project_email_dispatch_receipt'
     and subject_id=any($1::text[])`,[stalledJobIds]);
  expect(stillLeased.rows[0]?.n).toBe("12");
  const again=await runMentorProjectEmailDispatchBatch(ready);
  expect(again.status).toBe("CHECKED");
  const saved=await pool.query<{status:string}>(`
   select metadata->>'status' as status from activity_events
   where subject_type='mentor_project_email_dispatch_receipt'
     and subject_id=$1`,[jobId]);
  expect(saved.rows).toHaveLength(2);
  expect(saved.rows.map(x=>x.status).sort()).toEqual(["CLAIMED","SUPPRESSED"]);
  expect(first.accepted).toBe(0);
  expect(again.accepted).toBe(0);

  // Deterministic persisted time fixture: an earlier RETRY is already six
  // minutes old and may now acquire its second claim. No sleeps, mocks or
  // provider calls; the foreign-college source still gets suppressed.
  await pool.query(`insert into activity_events
   (id,organization_id,college_id,actor_user_id,module,event_type,
    subject_type,subject_id,summary,metadata,occurred_at)
   values ($1,$2,$3,$4,'PROJECTS',$5,'mentor_project_email_job',$6,
    'Retry policy fixture',$7::jsonb,clock_timestamp()-interval '7 minutes')`,[
    retryJobId,SEED_IDS.organization,SEED_IDS.collegeA,
    SEED_IDS.collegeAdminUser,
    ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_QUEUED,sourceId,
    JSON.stringify({sourceEventId:sourceId,recipientUserId:SEED_IDS.facultyUser,
      projectId,kind:"FINAL_SUBMISSION"}),
  ]);
  await pool.query(`insert into activity_events
   (id,organization_id,college_id,actor_user_id,module,event_type,
    subject_type,subject_id,summary,metadata,occurred_at)
   values ($1,$2,$3,$4,'PROJECTS',$5,
    'mentor_project_email_dispatch_receipt',$6,'Earlier unsuccessful provider',
    '{"status":"RETRY","attempt":1}'::jsonb,
    clock_timestamp()-interval '6 minutes')`,[
    retryReceiptId,SEED_IDS.organization,SEED_IDS.collegeA,
    SEED_IDS.collegeAdminUser,
    ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_DISPATCH_STATE,retryJobId,
  ]);
  const restart=await runMentorProjectEmailDispatchBatch({
   ...ready,MENTOR_PROJECT_EMAIL_ACTIVATED_AT:
     new Date(Date.now()-10*60*1000).toISOString(),
  });
  expect(restart.suppressed).toBeGreaterThanOrEqual(1);
  const priorRetry=await pool.query<{status:string;attempt:number}>(`
    select metadata->>'status' as status,
      (metadata->>'attempt')::integer as attempt
    from activity_events
    where subject_type='mentor_project_email_dispatch_receipt'
      and subject_id=$1 order by occurred_at,id`,[retryJobId]);
  expect(priorRetry.rows).toEqual([
   {status:"RETRY",attempt:1},{status:"CLAIMED",attempt:2},
   {status:"SUPPRESSED",attempt:2},
  ]);
 });
});
