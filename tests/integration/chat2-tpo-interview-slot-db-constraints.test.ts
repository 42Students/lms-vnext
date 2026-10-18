import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {
 createPlacementCandidateFixture,createPlacementFixture,createPrincipal,
 createTenant,newHarnessPool,withProjectPg,type PgHarness,
 type PlacementFixture,type PlacementCandidateFixture,type PrincipalFixture,
} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

type Case={
 db:PgHarness;
 actor:PrincipalFixture;
 drive:PlacementFixture;
 candidate:PlacementCandidateFixture;
};
async function withCase(action:(data:Case)=>Promise<void>){
 await withProjectPg(pool,async db=>{
  const college=await createTenant(db,"Interview constraint college");
  const actor=await createPrincipal(db,college,["TPO"]);
  const learner=await createPrincipal(db,college,["LEARNER"]);
  const drive=await createPlacementFixture(db,college,actor);
  const candidate=await createPlacementCandidateFixture(db,drive,learner,actor);
  const [registration]=await db.query<{name:string|null}>(
   "select to_regclass('public.placement_round_candidate_slots')::text as name");
  expect(registration?.name).toBe("placement_round_candidate_slots");
  await action({db,actor,drive,candidate});
 });
}
async function slot(data:Case,room:string,start="2026-10-20T04:00:00Z",end="2026-10-20T04:30:00Z"){
 const [row]=await data.db.query<{id:string;version:number;status:string}>(`
  insert into placement_round_candidate_slots
   (job_id,round_id,starts_at,ends_at,room,status,changed_by_user_id)
  values ($1,$2,$3::timestamptz,$4::timestamptz,$5,'AVAILABLE',$6)
  returning id,version,status
 `,[data.drive.jobId,data.drive.roundId,start,end,room,data.actor.userId]);
 return row!;
}

describe("TPO-BREAK-interview-PG-01 real PostgreSQL constraints and rollback",()=>{
 it("enforces positive durations and valid status/booking shapes",async()=>{
  await withCase(async data=>{
   await data.db.expectSqlState(()=>data.db.query(`
    insert into placement_round_candidate_slots
     (job_id,round_id,starts_at,ends_at,room,changed_by_user_id)
    values ($1,$2,'2026-10-20T04:30:00Z','2026-10-20T04:00:00Z','Hall A',$3)
   `,[data.drive.jobId,data.drive.roundId,data.actor.userId]),"23514");
   const row=await slot(data,"Hall A");
   await data.db.expectSqlState(()=>data.db.query(
    "update placement_round_candidate_slots set status='BOOKED' where id=$1",
    [row.id]),"23514");
   await data.db.expectSqlState(()=>data.db.query(
    "update placement_round_candidate_slots set version=0 where id=$1",
    [row.id]),"23514");
   const current=await data.db.query<{status:string;version:number}>(
    "select status,version from placement_round_candidate_slots where id=$1",[row.id]);
   expect(current[0]).toEqual({status:"AVAILABLE",version:1});
  });
 });
 it("never double-allocates the same active room and start within a round",async()=>{
  await withCase(async data=>{
   await slot(data,"Hall A");
   await data.db.expectSqlState(()=>slot(data,"Hall A","2026-10-20T04:00:00Z","2026-10-20T04:45:00Z"),"23505");
   // Cancelled slots are historical evidence and may be replaced safely.
   await data.db.query("update placement_round_candidate_slots set status='CANCELLED' where room='Hall A' and round_id=$1",
    [data.drive.roundId]);
   expect((await slot(data,"Hall A")).status).toBe("AVAILABLE");
  });
 });
 it("rejects two BOOKED rows for the same application across distinct slots",async()=>{
  await withCase(async data=>{
   const first=await slot(data,"Room 1");
   const second=await slot(data,"Room 2","2026-10-20T05:00:00Z","2026-10-20T05:30:00Z");
   await data.db.query(`
    update placement_round_candidate_slots
    set status='BOOKED',application_id=$2 where id=$1`,
    [first.id,data.candidate.applicationId]);
   await data.db.expectSqlState(()=>data.db.query(`
    update placement_round_candidate_slots
    set status='BOOKED',application_id=$2 where id=$1`,
    [second.id,data.candidate.applicationId]),"23505");
   const rows=await data.db.query<{n:number}>(`
    select count(*)::int n from placement_round_candidate_slots
    where round_id=$1 and application_id=$2 and status='BOOKED'`,
    [data.drive.roundId,data.candidate.applicationId]);
   expect(rows[0]?.n).toBe(1);
  });
 });
 it("rejects a foreign round/job composite even when both UUIDs exist",async()=>{
  await withCase(async data=>{
   const otherCollege=await createTenant(data.db,"Out-of-scope college");
   const otherActor=await createPrincipal(data.db,otherCollege,["TPO"]);
   const otherDrive=await createPlacementFixture(data.db,otherCollege,otherActor);
   await data.db.expectSqlState(()=>data.db.query(`
    insert into placement_round_candidate_slots
     (job_id,round_id,starts_at,ends_at,room,changed_by_user_id)
    values ($1,$2,'2026-10-20T04:00:00Z','2026-10-20T04:30:00Z','Hall A',$3)`,
    [otherDrive.jobId,data.drive.roundId,data.actor.userId]),"23503");
   expect((await data.db.query("select id from placement_round_candidate_slots where round_id=$1",
    [data.drive.roundId]))).toHaveLength(0);
  });
 });
 it("supports optimistic version conflicts without silently overwriting",async()=>{
  await withCase(async data=>{
   const initial=await slot(data,"Hall A");
   const first=await data.db.query<{version:number}>(`
    update placement_round_candidate_slots
    set room='Hall B',version=version+1
    where id=$1 and version=$2 returning version`,[initial.id,initial.version]);
   expect(first[0]?.version).toBe(initial.version+1);
   const stale=await data.db.query(`
    update placement_round_candidate_slots
    set room='Hall C',version=version+1
    where id=$1 and version=$2 returning id`,[initial.id,initial.version]);
   expect(stale).toHaveLength(0);
   const row=await data.db.query<{room:string}>(
    "select room from placement_round_candidate_slots where id=$1",[initial.id]);
   expect(row[0]?.room).toBe("Hall B");
  });
 });
 it("fully rolls back a partial booking mutation without leaving an orphan",async()=>{
  await withCase(async data=>{
   const initial=await slot(data,"Hall A");
   await data.db.savepoint(async()=>{
    await data.db.query(`
     update placement_round_candidate_slots
     set status='BOOKED',application_id=$2,version=version+1
     where id=$1`,[initial.id,data.candidate.applicationId]);
    const booked=await data.db.query<{status:string}>(
     "select status from placement_round_candidate_slots where id=$1",[initial.id]);
    expect(booked[0]?.status).toBe("BOOKED");
   },true);
   const after=await data.db.query<{status:string;application_id:string|null;version:number}>(
    "select status,application_id,version from placement_round_candidate_slots where id=$1",[initial.id]);
   expect(after[0]).toEqual({status:"AVAILABLE",application_id:null,version:initial.version});
  });
 });
});
