import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { getTpoDriveLifecycleReadiness } from "@/modules/placements/tpo-drive-lifecycle-service";
import { projectTpoDriveNextStep } from "@/modules/placements/tpo-drive-next-step-model";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = process.env.DB09_ISOLATED_TEST_DATABASE === "1" && Boolean(process.env.TEST_DATABASE_URL);
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}) : null;
const ctx: RequestContext = {
  user: {id:SEED_IDS.facultyUser,identityUid:"drive-next-step",platformStatus:"ACTIVE",systemRoles:[]},
  membership: {id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
const ids:{company?:string;relationship?:string;job?:string;role?:string}={};
let membershipRoleId:string|undefined;
describe.skipIf(!enabled)("TPO-drive-workspace-02 real persisted readiness",()=>{
  beforeAll(async()=>{
    if(!pool)throw Error("Disposable database required");
    const role=await pool.query<{id:string}>(
      "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
      [SEED_IDS.facultyCollegeAMembership]);
    membershipRoleId=role.rows[0]?.id;
    const token=randomUUID();
    ids.company=(await pool.query<{id:string}>(
      "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
      ["Next step "+token, SEED_IDS.facultyUser])).rows[0]!.id;
    ids.relationship=(await pool.query<{id:string}>(
      "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3) RETURNING id",
      [SEED_IDS.collegeA,ids.company,SEED_IDS.facultyUser])).rows[0]!.id;
    ids.job=(await pool.query<{id:string}>(
      "INSERT INTO placement_jobs(college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,application_mode,status,created_by_user_id) VALUES($1,$2,$3,$4,'Fixture','FULL_TIME','ONSITE','INTERNAL','DRAFT',$5) RETURNING id",
      [SEED_IDS.collegeA,SEED_IDS.placementSeasonA,ids.relationship,"Next step "+token,SEED_IDS.facultyUser])).rows[0]!.id;
  });
  afterAll(async()=>{
    if(pool){
      if(ids.job)await pool.query("DELETE FROM placement_jobs WHERE id=$1",[ids.job]);
      if(ids.relationship)await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relationship]);
      if(ids.company)await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
      if(membershipRoleId)await pool.query("DELETE FROM membership_roles WHERE id=$1",[membershipRoleId]);
      await pool.end();
    }
    await closeDatabaseConnection();
  });
  it("takes a college-scoped publish decision from registered tables, not UI guesses",async()=>{
    if(!ids.job)throw Error("Fixture unavailable");
    const readiness=await getTpoDriveLifecycleReadiness(ctx,ids.job);
    expect(readiness.status).toBe("DRAFT");
    expect(readiness.publish.allowed).toBe(false);
    const step=projectTpoDriveNextStep({
      jobId:ids.job,status:readiness.status,publishAllowed:readiness.publish.allowed,
      closeAllowed:readiness.close.allowed,shortlistCount:null,pendingRequests:0,stagedRounds:[],
    });
    expect(step.primary.label).toBe("Fix these before publishing");
    expect(step.primary.href).toContain(encodeURIComponent(ids.job)+"/edit");
  });
});
