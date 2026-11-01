import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {createPlacementSeason,closePlacementSeason} from "@/modules/placements/season-service";
import {changeTpoSeason} from "@/modules/placements/tpo-season-write-service";

assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:3});
const actor:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"db019-p20-season",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
const testSeason=SEED_IDS.placementSeasonA;

async function withRevokedTpo<T>(test:()=>Promise<T>):Promise<T>{
 const existing=await pool.query<{id:string}>(
  "SELECT id FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
  [SEED_IDS.facultyCollegeAMembership],
 );
 if(existing.rows.length!==1)throw new Error("Disposable fixture requires one seeded TPO role");
 await pool.query("DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
  [SEED_IDS.facultyCollegeAMembership]);
 try{return await test();}
 finally{await pool.query(
  "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT (membership_id,role) DO NOTHING",
  [SEED_IDS.facultyCollegeAMembership],
 );}
}

afterAll(async()=>{await pool.end();await closeDatabaseConnection()});

describe("DB19-P20 registered PG17 season write authorization",()=>{
 it("rejects a stale TPO context on edit, create and close after its persisted role is revoked",async()=>{
  const [before]= (await pool.query<{id:string;name:string;code:string;updated_at:Date;start_date:string;end_date:string;status:string}>(
   "SELECT id,name,code,updated_at,start_date::text,end_date::text,status "+
   "FROM placement_seasons WHERE id=$1",[testSeason],
  )).rows;
  expect(before?.status).toBe("ACTIVE");
  const auditBefore=(await pool.query<{count:number}>(
   "SELECT count(*)::int AS count FROM activity_events WHERE subject_id=$1 AND "+
   "event_type='PLACEMENTS_SEASON_DETAILS_UPDATED'",[testSeason],
  )).rows[0]?.count??0;
  await withRevokedTpo(async()=>{
   await expect(changeTpoSeason(actor,{
    action:"EDIT",confirmed:true,seasonId:testSeason,
    expectedUpdatedAt:before.updated_at.toISOString(),
    name:"Denied revocation edit",code:before.code,
    startDate:before.start_date,endDate:before.end_date,
   })).rejects.toBeInstanceOf(AuthorizationError);
   await expect(createPlacementSeason(actor,{
    collegeId:SEED_IDS.collegeA,name:"Denied revocation create",
    code:"DENY-P20",startDate:"2027-07-01",endDate:"2028-06-30",
   })).rejects.toBeInstanceOf(AuthorizationError);
   await expect(closePlacementSeason(actor,testSeason))
    .rejects.toBeInstanceOf(AuthorizationError);
  });
  const [after]=(await pool.query<{name:string;code:string;status:string;updated_at:Date}>(
   "SELECT name,code,status,updated_at FROM placement_seasons WHERE id=$1",
   [testSeason],
  )).rows;
  expect(after).toMatchObject({
   name:before.name,code:before.code,status:"ACTIVE",updated_at:before.updated_at,
  });
  const auditAfter=(await pool.query<{count:number}>(
   "SELECT count(*)::int AS count FROM activity_events WHERE subject_id=$1 AND "+
   "event_type='PLACEMENTS_SEASON_DETAILS_UPDATED'",[testSeason],
  )).rows[0]?.count??0;
  expect(auditAfter).toBe(auditBefore);
 },20_000);

 it("serializes college lock with role revocation and rejects after the revoke commits first",async()=>{
  const [before]=(await pool.query<{name:string;code:string;updated_at:Date;start_date:string;end_date:string}>(
   "SELECT name,code,updated_at,start_date::text,end_date::text FROM placement_seasons WHERE id=$1",
   [testSeason],
  )).rows;
  const holder=await pool.connect();
  let held=false,roleDeleted=false;
  let pending:Promise<unknown>|null=null;
  try{
   await holder.query("BEGIN");held=true;
   await holder.query("SELECT id FROM colleges WHERE id=$1 FOR UPDATE",[SEED_IDS.collegeA]);
   pending=changeTpoSeason(actor,{
    action:"EDIT",confirmed:true,seasonId:testSeason,
    expectedUpdatedAt:before.updated_at.toISOString(),
    name:"Race should deny",code:before.code,
    startDate:before.start_date,endDate:before.end_date,
   });
   // Keep the rejected Promise observed while waiting on the row lock.
   const completion=pending.then(()=>({ok:true}),error=>({ok:false,error}));
   let waiting=false;
   for(let attempts=0;attempts<160;attempts++){
    const query=await pool.query<{blocked:string}>(
     "SELECT count(*)::text AS blocked FROM pg_stat_activity "+
     "WHERE datname=current_database() AND pid<>pg_backend_pid() "+
     "AND wait_event_type='Lock' AND query ILIKE '%colleges%'",
    );
    if(Number(query.rows[0]?.blocked??0)>=1){waiting=true;break;}
    await new Promise(resolve=>setTimeout(resolve,25));
   }
   expect(waiting).toBe(true);
   await holder.query(
    "DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
    [SEED_IDS.facultyCollegeAMembership],
   );roleDeleted=true;
   await holder.query("COMMIT");held=false;
   const result=await completion;
   expect(result).toMatchObject({ok:false,error:{name:"AuthorizationError"}});
   const now=(await pool.query<{name:string}>(
    "SELECT name FROM placement_seasons WHERE id=$1",[testSeason],
   )).rows[0];
   expect(now?.name).toBe(before.name);
  }finally{
   if(held)await holder.query("ROLLBACK").catch(()=>undefined);
   holder.release();
   if(pending)await pending.catch(()=>undefined);
   if(roleDeleted)await pool.query(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT (membership_id,role) DO NOTHING",
    [SEED_IDS.facultyCollegeAMembership],
   );
  }
 },20_000);
});
