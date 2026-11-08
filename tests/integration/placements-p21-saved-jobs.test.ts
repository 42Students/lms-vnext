import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob } from "@/modules/placements/job-service";
import {
  listOwnPlacementSavedJobs,
  saveOwnPlacementJob,
  unsaveOwnPlacementJob,
} from "@/modules/placements/saved-job-service";
import { publishPreparedPlacementJob } from "../support/publishable-job-fixture";
import { publishableJobTerms } from "../support/publishable-job-terms";
import { deletePlacementRowTrees } from "../support/placement-job-tree-cleanup";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";
import { SEED_IDS } from "../../scripts/db-seed-data";

/** Isolated registered PG17 runtime witness for DB19-P21 learner bookmarks.
 * Do not run against any shared/staging/production database. */
const url = process.env.TEST_DATABASE_URL;
if (!url || url !== process.env.DATABASE_URL ||
    process.env.DB08_ISOLATED_TEST_DATABASE !== "1" ||
    process.env.DB08_C_MIGRATION_APPLIED !== "1") {
  throw new Error("P21 saved jobs require identical disposable PG17 URLs and both DB08 isolation guards");
}
const pool = new Pool({connectionString:url,max:3});
const learner: RequestContext = {
  user: {id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership: {id:SEED_IDS.learnerCollegeAMembership,organizationId:SEED_IDS.organization,
    collegeId:SEED_IDS.collegeA,status:"ACTIVE",roles:["LEARNER"]},
};
const tpo: RequestContext = {
  user: {id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
  membership: {id:SEED_IDS.facultyCollegeAMembership,organizationId:SEED_IDS.organization,
    collegeId:SEED_IDS.collegeA,status:"ACTIVE",roles: ["TPO"]},
};

async function clean() {
  await deletePlacementRowTrees(pool);
  await pool.query("DELETE FROM placement_company_relationships");
  await pool.query("DELETE FROM placement_companies");
}

async function createPublishedJob() {
  const uid=randomUUID();
  const company=await createPlacementCompany(tpo,{
    collegeId:SEED_IDS.collegeA,name:"P21 saved jobs "+uid,
    primaryDomain:"p21-"+uid+".example",
  });
  const job=await createPlacementJob(tpo,{
    ...publishableJobTerms,
    collegeId:SEED_IDS.collegeA,
    companyRelationshipId:company.relationship.id,
    title:"P21 saved job "+uid,
    description:"Registered PG17 bookmark authorization witness",
    employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL",
  });
  await publishPreparedPlacementJob(tpo,job.id);
  return job;
}

beforeEach(async()=>{
  await clean();
  await enableSeedLearnerPlacementAccess(pool);
});
afterAll(async()=>{
  await clean();
  await pool.end();
  await closeDatabaseConnection();
});

describe("DB19-P21 learner saved jobs, actual registered PostgreSQL",()=>{
  it("idempotently saves, lists and removes an authorized published bookmark",async()=>{
    const job=await createPublishedJob();
    const saved=await saveOwnPlacementJob(learner,job.id);
    expect(saved?.jobId).toBe(job.id);
    const retry=await saveOwnPlacementJob(learner,job.id);
    expect(retry?.id).toBe(saved?.id);
    const rows=await listOwnPlacementSavedJobs(learner);
    expect(rows.map(x=>x.jobId)).toContain(job.id);
    const stored=await pool.query(
      "SELECT id FROM placement_saved_jobs WHERE membership_id=$1 AND job_id=$2",
      [SEED_IDS.learnerCollegeAMembership,job.id],
    );
    expect(stored.rows).toHaveLength(1);
    await expect(unsaveOwnPlacementJob(learner,job.id)).resolves.toMatchObject({removed:true});
    expect(await listOwnPlacementSavedJobs(learner)).toHaveLength(0);
  });

  it("denies stale learner read, save and unsave after persisted account disablement",async()=>{
    const job=await createPublishedJob();
    await saveOwnPlacementJob(learner,job.id);
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",
      [SEED_IDS.learnerUser]);
    try {
      await expect(listOwnPlacementSavedJobs(learner))
        .rejects.toThrow("Missing permission: placements.read");
      await expect(saveOwnPlacementJob(learner,job.id))
        .rejects.toThrow("Missing permission: placements.read");
      await expect(unsaveOwnPlacementJob(learner,job.id))
        .rejects.toThrow("Missing permission: placements.read");
      const row=await pool.query(
        "SELECT id FROM placement_saved_jobs WHERE membership_id=$1 AND job_id=$2",
        [SEED_IDS.learnerCollegeAMembership,job.id],
      );
      expect(row.rows).toHaveLength(1);
    } finally {
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",
        [SEED_IDS.learnerUser]);
    }
  });

  it("rejects an in-flight bookmark when account disablement wins the race",async()=>{
    const job=await createPublishedJob();
    const blockerPool=new Pool({connectionString:url,max:1});
    const holder=await blockerPool.connect();
    let held=false;
    let pending:Promise<{ok:boolean;error?:unknown}>|null=null;
    try {
      await holder.query("BEGIN");
      held=true;
      const rows=await holder.query("SELECT id FROM users WHERE id=$1 FOR UPDATE",
        [SEED_IDS.learnerUser]);
      expect(rows.rows).toHaveLength(1);
      pending=saveOwnPlacementJob(learner,job.id)
        .then(()=>({ok:true}),error=>({ok:false,error}));
      let blocked=false;
      for(let attempt=0;attempt<160;attempt++){
        const waiting=await pool.query<{blocked:string}>(
          "SELECT count(*)::text AS blocked FROM pg_stat_activity " +
          "WHERE datname=current_database() AND pid<>pg_backend_pid() " +
          "AND wait_event_type='Lock' AND query ILIKE '%college_memberships%'",
        );
        if(Number(waiting.rows[0]?.blocked??0)>0){blocked=true;break;}
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      expect(blocked).toBe(true);
      await holder.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",
        [SEED_IDS.learnerUser]);
      await holder.query("COMMIT");
      held=false;
      const outcome=await pending;
      expect(outcome.ok).toBe(false);
      expect(String((outcome.error as Error)?.message??""))
        .toContain("Missing permission: placements.read");
      const saved=await pool.query(
        "SELECT id FROM placement_saved_jobs WHERE membership_id=$1 AND job_id=$2",
        [SEED_IDS.learnerCollegeAMembership,job.id],
      );
      expect(saved.rows).toHaveLength(0);
    } finally {
      if(held)await holder.query("ROLLBACK").catch(()=>undefined);
      holder.release();
      if(pending)await pending;
      await blockerPool.end();
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",
        [SEED_IDS.learnerUser]);
    }
  },20_000);

  it("database rejects saved jobs crossing a membership or job college",async()=>{
    const job=await createPublishedJob();
    await expect(pool.query(
      "INSERT INTO placement_saved_jobs(college_id,membership_id,job_id) VALUES($1,$2,$3)",
      [SEED_IDS.collegeB,SEED_IDS.learnerCollegeAMembership,job.id],
    // The registered DB08 college guard rejects this before the composite
    // FK, preserving the stricter learner/job tenant boundary.
    )).rejects.toMatchObject({
      code:"23514",
      message:expect.stringContaining("Saved job does not share learner college"),
    });
    const rows=await pool.query("SELECT id FROM placement_saved_jobs WHERE job_id=$1",
      [job.id]);
    expect(rows.rows).toHaveLength(0);
  });
});
