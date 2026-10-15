import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { exportCollegeClasses } from "@/modules/academics/college-classes-export-service";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = !!process.env.TEST_DATABASE_URL && process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool = enabled ? new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;
const own:RequestContext={
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"class-export-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const other:RequestContext={...own,membership:{...own.membership!,
  id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
const wrongRole:RequestContext={...own,membership:{...own.membership!,roles:["FACULTY"]}};
const id={period:randomUUID(),program:randomUUID(),cohort:randomUUID(),section:randomUUID()};
const label="w-csv-classes-"+id.section.slice(0,8);

describe.skipIf(!enabled)("College classes export persisted PostgreSQL scope",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable PostgreSQL required");
    await pool.query("INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31')",
      [id.period,SEED_IDS.collegeA,label]);
    await pool.query("INSERT INTO programs(id,department_id,name,code,duration_terms) VALUES($1,$2,$3::text,$3::text,8)",
      [id.program,SEED_IDS.departmentA,label]);
    await pool.query("INSERT INTO cohorts(id,program_id,name,code,start_period_id) VALUES($1,$2,$3::text,$3::text,$4)",
      [id.cohort,id.program,label,id.period]);
    await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4::text,$4::text)",
      [id.section,id.cohort,id.period,label]);
  });
  afterAll(async()=>{
    try{
      if(pool)for(const [table,uid] of [
        ["sections",id.section],["cohorts",id.cohort],["programs",id.program],["academic_periods",id.period],
      ]as const)await pool.query(`DELETE FROM ${table} WHERE id=$1`,[uid]);
    }finally{await pool?.end();await closeDatabaseConnection();}
  });
  it("exports only persisted own-college class records",async()=>{
    const result=await exportCollegeClasses(own,{q:label,status:"ALL"});
    expect(result.exported).toBe(1);
    expect(result.csv).toContain(label);
    const unsetCapacity = await exportCollegeClasses(own,{q:label,status:"ALL",capacityState:"UNSET"});
    const configuredCapacity = await exportCollegeClasses(own,{q:label,status:"ALL",capacityState:"CONFIGURED"});
    expect(unsetCapacity.csv).toContain(label);
    expect(configuredCapacity.exported).toBe(0);
    const withBatchCode = await exportCollegeClasses(own,{q:label,status:"ALL",cohortCode:label});
    expect(withBatchCode.csv).toContain(label);
    const otherBatch = await exportCollegeClasses(own,{q:label,status:"ALL",cohortCode:"nonexistent-cohort"});
    expect(otherBatch.exported).toBe(0);
    const foreign=await exportCollegeClasses(other,{q:label,status:"ALL"});
    expect(foreign.exported).toBe(0);
    expect(foreign.csv).not.toContain(label);
  });
  it("denies wrong-role and forged college selection",async()=>{
    await expect(exportCollegeClasses(wrongRole,{})).rejects.toBeInstanceOf(AuthorizationError);
    await expect(exportCollegeClasses(own,{collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  });
  it("exports only matching own-college academic period status records",async()=>{
    const found=await pool!.query<{status:string}>("SELECT status FROM academic_periods WHERE id=$1",[id.period]);const actual=found.rows[0]!.status;const other=actual==="CLOSED"?"ACTIVE":"CLOSED";
    const ownRows=await exportCollegeClasses(own,{q:label,periodLifecycle:actual});
    const missingRows=await exportCollegeClasses(own,{q:label,periodLifecycle:other});
    const foreignRows=await exportCollegeClasses(other,{q:label,periodLifecycle:actual});
    expect(ownRows.csv).toContain(label);
    expect(missingRows.exported).toBe(0);
    expect(foreignRows.exported).toBe(0);
  });
  it("exports only matching exact program code in its own college",async()=>{
    const [included,excluded,foreign]=await Promise.all([
      exportCollegeClasses(own,{q:label,programCode:label}),
      exportCollegeClasses(own,{q:label,programCode:"NOT-MATCHED"}),
      exportCollegeClasses(other,{q:label,programCode:label}),
    ]);
    expect(included.csv).toContain(label);
    expect(excluded.exported).toBe(0);
    expect(foreign.exported).toBe(0);
  });
  it("exports only matching exact class name in its own college",async()=>{
    const [included,excluded,foreign]=await Promise.all([
      exportCollegeClasses(own,{q:label,className:label}),
      exportCollegeClasses(own,{q:label,className:"NOT-MATCHED"}),
      exportCollegeClasses(other,{q:label,className:label}),
    ]);
    expect(included.csv).toContain(label);
    expect(excluded.exported).toBe(0);
    expect(foreign.exported).toBe(0);
  });
});
