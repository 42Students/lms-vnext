import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getCollegeDashboardCards } from "@/modules/admin-ui/college-dashboard-cards-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, {serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const adminA: RequestContext = {
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"dashboard-a",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const adminB: RequestContext = {
  user:{id:SEED_IDS.facultyUser,identityUid:"dashboard-b",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const learner:RequestContext={...adminA,membership:{...adminA.membership!,roles:["LEARNER"]}};
const deptId=randomUUID();
const label="Dashboard-evidence-"+deptId.slice(0,8);

describe.skipIf(!enabled)("College dashboard cards registered PG",()=>{
  beforeAll(async()=>{
    if(!pool)throw new Error("Disposable PG required");
    await pool.query("INSERT INTO departments(id,college_id,name) VALUES($1,$2,$3)",
      [deptId,SEED_IDS.collegeA,label]);
  });
  afterAll(async()=>{
    try{
      if(pool)await pool.query("DELETE FROM departments WHERE id=$1",[deptId]);
    }finally{await pool?.end();await closeDatabaseConnection();}
  });
  it("uses actual own-college persisted counts and fixed deep links",async()=>{
    const result=await getCollegeDashboardCards(adminA);
    const expected=await pool!.query("SELECT count(*)::int AS n FROM departments WHERE college_id=$1 AND archived_at IS NULL",
      [SEED_IDS.collegeA]);
    const step=result.setup.phases.flatMap(p=>p.steps).find(x=>x.key==="departments");
    expect(step?.count).toBe(expected.rows[0].n);
    expect(result.cards.find(x=>x.key==="students")?.count).toBeGreaterThanOrEqual(0);
    expect(result.cards.every(x=>x.href.startsWith("/college/"))).toBe(true);
    const { collegeDashboardEmptyRecordPrompts } = await import("@/modules/admin-ui/college-dashboard-cards-model");
    const prompts = collegeDashboardEmptyRecordPrompts(result.cards);
    expect(prompts.every(x=>x.href.startsWith("/college/"))).toBe(true);
  });
  it("uses different scoped counts for another college without leaking fixture",async()=>{
    const result=await getCollegeDashboardCards(adminB);
    const expected=await pool!.query("SELECT count(*)::int AS n FROM departments WHERE college_id=$1 AND archived_at IS NULL",
      [SEED_IDS.collegeB]);
    const step=result.setup.phases.flatMap(p=>p.steps).find(x=>x.key==="departments");
    expect(step?.count).toBe(expected.rows[0].n);
  });
  it("rejects foreign college selector and non-admin role",async()=>{
    await expect(getCollegeDashboardCards(adminA,{collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
    await expect(getCollegeDashboardCards(learner,{})).rejects.toBeInstanceOf(AuthorizationError);
  });
});
