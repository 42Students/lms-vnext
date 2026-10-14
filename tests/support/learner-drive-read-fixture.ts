import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerPlacementWriteFixture, seedLearnerPlacementWriteFixture,
  cleanupLearnerPlacementWriteFixture,
} from "./learner-placement-write-fixture";

export function newLearnerDriveReadFixture(){
  return {learner:newLearnerPlacementWriteFixture(),ids:{
    season:randomUUID(),company:randomUUID(),relation:randomUUID(),
    olderJob:randomUUID(),newerJob:randomUUID(),olderRole:randomUUID(),newerRole:randomUUID(),
  }};
}
export type LearnerDriveReadFixture=ReturnType<typeof newLearnerDriveReadFixture>;
export async function seedLearnerDriveReadFixture(pool:Pool,f: LearnerDriveReadFixture){
  const {learner,ids}=f;
  await seedLearnerPlacementWriteFixture(pool,learner);
  await pool.query(
    "INSERT INTO placement_seasons(id,college_id,name,code,start_date,end_date,created_by_user_id) VALUES($1,$2,$3,$4,'2026-07-01','2027-12-31',$5)",
    [ids.season,learner.ids.college,"Read season "+ids.season,"LR-S-"+ids.season.slice(0,9),SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    "INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)",
    [ids.company,"Read Employer "+ids.company,SEED_IDS.collegeAdminUser],
  );
  await pool.query(
    "INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)",
    [ids.relation,learner.ids.college,ids.company,SEED_IDS.collegeAdminUser],
  );
  const insertJob=[
    "INSERT INTO placement_jobs(id,college_id,season_id,company_relationship_id,title,description,",
    "employment_type,work_mode,status,published_at,application_deadline,created_by_user_id)",
    "VALUES($1,$2,$3,$4,$5,$6,'FULL_TIME','REMOTE','PUBLISHED',$7,$8,$9)",
  ].join(" ");
  for(const [jobId,title,publishedAt,deadline] of [
    [ids.olderJob,"Older role "+ids.olderJob,"2026-10-01T00:00:00Z","2026-10-17T00:00:00Z"],
    [ids.newerJob,"Newer role "+ids.newerJob,"2026-10-10T00:00:00Z","2026-10-16T00:00:00Z"],
  ]){
    await pool.query(insertJob,[
      jobId,learner.ids.college,ids.season,ids.relation,title,"Own published drive",
      publishedAt,deadline,SEED_IDS.collegeAdminUser,
    ]);
  }
  for(const [roleId,jobId,title] of [
    [ids.olderRole,ids.olderJob,"Older Engineer"],
    [ids.newerRole,ids.newerJob,"Newer Engineer"],
  ]){
    await pool.query(
      "INSERT INTO placement_job_role_options(id,job_id,title,employment_type,work_mode,is_primary) VALUES($1,$2,$3,'FULL_TIME','REMOTE',true)",
      [roleId,jobId,title],
    );
  }
}
export async function cleanupLearnerDriveReadFixture(pool:Pool,f:LearnerDriveReadFixture){
  const {ids,learner}=f;
  await pool.query("DELETE FROM placement_job_role_options WHERE id=ANY($1::uuid[])",[
    [ids.olderRole,ids.newerRole],
  ]);
  await pool.query("DELETE FROM placement_jobs WHERE id=ANY($1::uuid[])",[
    [ids.olderJob,ids.newerJob],
  ]);
  await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[ids.relation]);
  await pool.query("DELETE FROM placement_companies WHERE id=$1",[ids.company]);
  await pool.query("DELETE FROM placement_seasons WHERE id=$1",[ids.season]);
  await cleanupLearnerPlacementWriteFixture(pool,learner);
}
