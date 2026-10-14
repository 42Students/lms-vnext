import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { exportCollegeDepartmentAttendance } from "@/modules/attendance/college-department-csv-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
const admin: RequestContext = {
  user: { id:SEED_IDS.collegeAdminUser,identityUid:"ca-attendance-export",platformStatus:"ACTIVE",systemRoles:[] },
  membership: { id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"] },
};
const other: RequestContext = {
  user: { ...admin.user,id:SEED_IDS.facultyUser },
  membership: { id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"] },
};
const learner: RequestContext = { ...admin, membership: {...admin.membership!, roles:["LEARNER"]} };
const ids={own:randomUUID(),foreign:randomUUID()};
const q="w-export-"+ids.own.slice(0,8);

describe.skipIf(!enabled)("College Admin attendance CSV scope on real PostgreSQL",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("TEST_DATABASE_URL required");
    await pool.query("INSERT INTO departments(id,college_id,name) VALUES($1,$2,$3),($4,$5,$6)",[
      ids.own,SEED_IDS.collegeA,q+" Own",
      ids.foreign,SEED_IDS.collegeB,q+" Foreign",
    ]);
  });
  afterAll(async()=>{
    try {
      if(pool)await pool.query("DELETE FROM departments WHERE id IN ($1,$2)",[ids.own,ids.foreign]);
    }finally{await pool?.end();await closeDatabaseConnection();}
  });
  it("exports same-college names only with honest zero marked sessions",async()=>{
    const own=await exportCollegeDepartmentAttendance(admin,{q});
    expect(own.rows).toBe(1);
    expect(own.csv).toContain(q+" Own");
    expect(own.csv).not.toContain(q+" Foreign");
    const foreign=await exportCollegeDepartmentAttendance(other,{q});
    expect(foreign.rows).toBe(1);
    expect(foreign.csv).toContain(q+" Foreign");
    expect(foreign.csv).not.toContain(q+" Own");
  });
  it("denies learners and forged college query",async()=>{
    await expect(exportCollegeDepartmentAttendance(learner,{q})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(exportCollegeDepartmentAttendance(admin,{q,collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  });
});
