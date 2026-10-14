import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  getCollegeHallAvailability, CollegeHallAvailabilityNotFoundError,
} from "@/modules/academics/college-hall-availability-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool = enabled ? new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}) : null;
const admin: RequestContext = {
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"hall-availability-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const foreign: RequestContext = {
  user:{...admin.user,id:SEED_IDS.facultyUser},
  membership:{id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const learner: RequestContext = {...admin,membership:{...admin.membership!,roles:["LEARNER"]}};
const ids={hall:randomUUID(),period:randomUUID(),program:randomUUID(),cohort:randomUUID(),
  section:randomUUID(),event:randomUUID()};
const tag="w-hall-avail-"+ids.hall.slice(0,8);
const query={hallId:ids.hall,from:"2026-10-14",to:"2026-10-14"};

describe.skipIf(!enabled)("College hall scheduled availability PG",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable PG required");
    await pool.query("INSERT INTO lecture_halls(id,college_id,name,capacity,room_type) VALUES($1,$2,$3,100,'LECTURE_HALL')",
      [ids.hall,SEED_IDS.collegeA,tag]);
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status) " +
      "VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31','ACTIVE')",
      [ids.period,SEED_IDS.collegeA,tag]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [ids.program,SEED_IDS.departmentA,tag]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [ids.cohort,ids.program,tag,ids.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code,capacity) VALUES($1,$2,$3,$4::text,$4::text,70)",
      [ids.section,ids.cohort,ids.period,tag]);
    await pool.query("INSERT INTO section_schedule_events(id,section_id,lecture_hall_id,title,starts_at,ends_at,status) " +
      "VALUES($1,$2,$3,$4,'2026-10-14T04:00:00Z','2026-10-14T05:00:00Z','SCHEDULED')",
      [ids.event,ids.section,ids.hall,tag]);
  });
  afterAll(async()=>{
    try {
      if(pool)for(const [table,id] of [
        ["section_schedule_events",ids.event],["sections",ids.section],
        ["cohorts",ids.cohort],["programs",ids.program],
        ["academic_periods",ids.period],["lecture_halls",ids.hall],
      ] as const)await pool.query(`DELETE FROM ${table} WHERE id=$1`,[id]);
    }finally{await pool?.end();await closeDatabaseConnection();}
  });
  it("shows exact IST-day scheduled rows and configured capacity",async()=>{
    const result=await getCollegeHallAvailability(admin,query);
    expect(result.hall.capacity).toBe(100);
    expect(result.sessions.map(s=>s.id)).toContain(ids.event);
    expect(result.sessions.find(s=>s.id===ids.event)?.startsAt).toBe("2026-10-14T04:00:00.000Z");
    expect(result.sessions.find(s=>s.id===ids.event)?.sectionCapacity).toBe(70);
    const empty=await getCollegeHallAvailability(admin,{...query,from:"2026-10-15",to:"2026-10-15"});
    expect(empty.sessions).toHaveLength(0);
  });
  it("foreign hall behaves exactly like missing, wrong role denied and forged selectors rejected",async()=>{
    await expect(getCollegeHallAvailability(foreign,query))
      .rejects.toBeInstanceOf(CollegeHallAvailabilityNotFoundError);
    await expect(getCollegeHallAvailability(admin,{...query,hallId:randomUUID()}))
      .rejects.toBeInstanceOf(CollegeHallAvailabilityNotFoundError);
    await expect(getCollegeHallAvailability(learner,query)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(getCollegeHallAvailability(admin,{...query,collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  });
});
