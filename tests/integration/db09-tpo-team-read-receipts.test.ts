import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import {SEED_IDS} from "../../scripts/db-seed-data";

const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL)&&
 process.env.TPO_TEAM_READ_RECEIPTS_SCHEMA_READY==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;

describe.skipIf(!enabled)("TPO-inbox-team-R05 read receipts PostgreSQL",()=>{
 afterAll(async()=>{await pool?.end();});
 it("TPO-inbox-team-R05 separates unread message positions from bell read state and rejects foreign college",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL is required");
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   await client.query(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT (membership_id,role) DO NOTHING",
    [SEED_IDS.collegeAdminMembership],
   );
   const created=await client.query<{id:string}>(
    "INSERT INTO placement_tpo_internal_threads(college_id,started_by_membership_id,invited_membership_id,topic)"+
    " VALUES($1,$2,$3,$4) RETURNING id",
    [SEED_IDS.collegeA,SEED_IDS.facultyCollegeAMembership,SEED_IDS.collegeAdminMembership,
     "Read receipts integration"],
   );
   const threadId=created.rows[0]?.id;
   if(!threadId)throw new Error("Thread fixture missing");
   await client.query(
    "INSERT INTO placement_tpo_internal_messages(thread_id,college_id,author_membership_id,body) VALUES($1,$2,$3,$4)",
    [threadId,SEED_IDS.collegeA,SEED_IDS.collegeAdminMembership,"A reply to read"],
   );
   const before=await client.query<{total:number}>(
    "SELECT count(*)::integer AS total FROM placement_tpo_internal_messages WHERE thread_id=$1 "+
    "AND author_membership_id<>$2 AND created_at>coalesce("+
    "(SELECT read_through FROM placement_tpo_internal_reads WHERE thread_id=$1 AND membership_id=$2),'-infinity'::timestamptz)",
    [threadId,SEED_IDS.facultyCollegeAMembership],
   );
   expect(before.rows[0]?.total).toBe(1);
   await client.query(
    "INSERT INTO placement_tpo_internal_reads(college_id,thread_id,membership_id,read_through) VALUES($1,$2,$3,$4)",
    [SEED_IDS.collegeA,threadId,SEED_IDS.facultyCollegeAMembership,"2099-06-01T12:00:00Z"],
   );
   const after=await client.query<{total:number}>(
    "SELECT count(*)::integer AS total FROM placement_tpo_internal_messages WHERE thread_id=$1 "+
    "AND author_membership_id<>$2 AND created_at>coalesce("+
    "(SELECT read_through FROM placement_tpo_internal_reads WHERE thread_id=$1 AND membership_id=$2),'-infinity'::timestamptz)",
    [threadId,SEED_IDS.facultyCollegeAMembership],
   );
   expect(after.rows[0]?.total).toBe(0);
   await client.query("SAVEPOINT foreign_receipt");
   await expect(client.query(
    "INSERT INTO placement_tpo_internal_reads(college_id,thread_id,membership_id,read_through) VALUES($1,$2,$3,$4)",
    [SEED_IDS.collegeB,threadId,SEED_IDS.facultyCollegeBMembership,"2099-06-01T12:00:00Z"],
   )).rejects.toBeDefined();
   await client.query("ROLLBACK TO SAVEPOINT foreign_receipt");
  }finally{
   await client.query("ROLLBACK");
   client.release();
  }
 });
 it("TPO-inbox-team-20 persists follow/mute toggles on the same member receipt without changing read time",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL is required");
  const client=await pool.connect();
  try{
   await client.query("BEGIN");
   const created=await client.query<{id:string}>(
    "INSERT INTO placement_tpo_internal_threads(college_id,started_by_membership_id,invited_membership_id,topic) VALUES($1,$2,$3,$4) RETURNING id",
    [SEED_IDS.collegeA,SEED_IDS.facultyCollegeAMembership,SEED_IDS.collegeAdminMembership,"Follow preference test"],
   );
   const threadId=created.rows[0]?.id;
   if(!threadId)throw new Error("Thread fixture missing");
   await client.query(
    "INSERT INTO placement_tpo_internal_reads(college_id,thread_id,membership_id,read_through,following,muted_at) VALUES($1,$2,$3,$4,false,$5)",
    [SEED_IDS.collegeA,threadId,SEED_IDS.facultyCollegeAMembership,
      "2099-06-01T00:00:00.000Z","2099-06-02T00:00:00.000Z"],
   );
   const current=await client.query<{following:boolean;muted:boolean}>(
    "SELECT following,muted_at is not null AS muted FROM placement_tpo_internal_reads WHERE thread_id=$1 AND membership_id=$2",
    [threadId,SEED_IDS.facultyCollegeAMembership],
   );
   expect(current.rows[0]).toMatchObject({following:false,muted:true});
   await client.query(
    "UPDATE placement_tpo_internal_reads SET following=true,muted_at=null WHERE thread_id=$1 AND membership_id=$2",
    [threadId,SEED_IDS.facultyCollegeAMembership],
   );
   const restored=await client.query<{following:boolean;muted:boolean;through:string}>(
    "SELECT following,muted_at is not null AS muted,read_through::text AS through FROM placement_tpo_internal_reads WHERE thread_id=$1 AND membership_id=$2",
    [threadId,SEED_IDS.facultyCollegeAMembership],
   );
   expect(restored.rows[0]?.following).toBe(true);
   expect(restored.rows[0]?.muted).toBe(false);
   expect(restored.rows[0]?.through).toContain("2099-06-01");
  }finally{
   await client.query("ROLLBACK");client.release();
  }
 });

});
