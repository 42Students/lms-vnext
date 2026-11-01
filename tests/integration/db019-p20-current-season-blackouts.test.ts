import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getCurrentTpoPlacementSeason} from "@/modules/placements/tpo-season-current-service";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import {SEED_IDS} from "../../scripts/db-seed-data";

assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2});
const actor:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"p20-current-blackouts",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,
  collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
  status:"ACTIVE",roles:["TPO"]},
};
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("DB19-P20 registered current-season blackout consumer",()=>{
 it("loads only current college blackouts from actual registered PG17 and never creates a season",async()=>{
  const ownedDay="2098-12-30",foreignDay="2098-12-31";
  const ownedId=randomUUID(),foreignId=randomUUID();
  const before=await pool.query<{n:number}>(
   "SELECT count(*)::int AS n FROM placement_seasons WHERE college_id=$1",
   [SEED_IDS.collegeA],
  );
  await pool.query(
   "INSERT INTO placement_tpo_blocked_dates(id,college_id,day,reason) "+
   "VALUES($1,$2,$3,$4),($5,$6,$7,$8)",
   [ownedId,SEED_IDS.collegeA,ownedDay,"P20 college-only exam",
    foreignId,SEED_IDS.collegeB,foreignDay,"P20 forbidden foreign exam"],
  );
  try{
   const current=await getCurrentTpoPlacementSeason(actor);
   expect(current.current).toBeTruthy();
   expect(current.registration.blockedDatesSupported).toBe(true);
   expect(current.registration.blockedDates).toEqual(expect.arrayContaining([
    {date:ownedDay,label:"P20 college-only exam"},
   ]));
   expect(current.registration.blockedDates.some(row=>row.date===foreignDay))
    .toBe(false);
   const after=await pool.query<{n:number}>(
    "SELECT count(*)::int AS n FROM placement_seasons WHERE college_id=$1",
    [SEED_IDS.collegeA],
   );
   expect(after.rows[0]?.n).toBe(before.rows[0]?.n);
  }finally{
   await pool.query("DELETE FROM placement_tpo_blocked_dates WHERE id=ANY($1::uuid[])",
    [[ownedId,foreignId]]);
  }
 });
});
