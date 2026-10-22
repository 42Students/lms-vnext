import {randomUUID,createHash} from "node:crypto";
import {describe,expect,it} from "vitest";
import {Pool} from "pg";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;

/** Requires the orchestrator's registered migration on disposable seeded PostgreSQL.
 * Not a staged-schema witness and never permitted against production data. */
describe.skipIf(!enabled)("Company applicant share PG capability acceptance",()=>{
 it("enforces expiry, revocation, tenant ownership and durable audited views",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL required");
  const client=await pool.connect();
  const company=randomUUID(),relationship=randomUUID(),season=randomUUID();
  const job=randomUUID(),share=randomUUID(),foreignShare=randomUUID();
  const digest=createHash("sha256").update(randomUUID()).digest("hex");
  const codeSalt=randomUUID().replaceAll("-","");
  const codeHash=createHash("sha256").update("disposable-share-code:"+codeSalt).digest("hex");
  try{
   await client.query("BEGIN");
   const names=await client.query<{
    shares:string|null;views:string|null;
   }>("select to_regclass('public.placement_company_applicant_shares')::text as shares, to_regclass('public.placement_company_applicant_share_views')::text as views");
   expect(names.rows[0]?.shares).toBeTruthy();
   expect(names.rows[0]?.views).toBeTruthy();
   await client.query(
    "insert into placement_companies(id,name,created_by_user_id) values($1,$2,$3)",
    [company,"Capability PG "+company.slice(0,8),SEED_IDS.collegeAdminUser],
   );
   await client.query(
    "insert into placement_company_relationships(id,college_id,company_id,created_by_user_id) values($1,$2,$3,$4)",
    [relationship,SEED_IDS.collegeA,company,SEED_IDS.collegeAdminUser],
   );
   await client.query(
    "insert into placement_seasons(id,college_id,name,code,start_date,end_date,created_by_user_id,status,closed_by_user_id,closed_at) values($1,$2,$3,$4,'2026-01-01','2026-12-31',$5,'CLOSED',$5,now())",
    [season,SEED_IDS.collegeA,"Capability test",season.slice(0,8),SEED_IDS.collegeAdminUser],
   );
   await client.query(
    "insert into placement_jobs(id,college_id,season_id,company_relationship_id,title,description,employment_type,work_mode,created_by_user_id,status,published_at) values($1,$2,$3,$4,'PG company share','Disposable capability','FULL_TIME','HYBRID',$5,'PUBLISHED',now())",
    [job,SEED_IDS.collegeA,season,relationship,SEED_IDS.collegeAdminUser],
   );
   await client.query(
    "insert into placement_company_applicant_shares(id,college_id,job_id,created_by_membership_id,token_hash,code_hash,code_salt,expires_at) values($1,$2,$3,$4,$5,$6,$7,clock_timestamp()+interval '1 day')",
    [share,SEED_IDS.collegeA,job,SEED_IDS.collegeAdminMembership,digest,codeHash,codeSalt],
   );
   const active=await client.query<{count:string}>(
    "select count(*)::text as count from placement_company_applicant_shares where id=$1 and revoked_at is null and expires_at>clock_timestamp()",
    [share],
   );
   expect(active.rows[0]?.count).toBe("1");
   await client.query(
    "insert into placement_company_applicant_share_views(share_id,college_id,event_kind) values($1,$2,'VIEW')",
    [share,SEED_IDS.collegeA],
   );
   await client.query(
    "insert into placement_company_applicant_share_views(share_id,college_id,event_kind) values($1,$2,'CSV')",
    [share,SEED_IDS.collegeA],
   );
   const csvEvents=await client.query<{count:string}>(
    "select count(*)::text as count from placement_company_applicant_share_views where share_id=$1 and event_kind='CSV'",
    [share],
   );
   expect(csvEvents.rows[0]?.count).toBe("1");
   await client.query("SAVEPOINT duplicate_token_hash");
   await expect(client.query(
    "insert into placement_company_applicant_shares(college_id,job_id,created_by_membership_id,token_hash,code_hash,code_salt,expires_at) values($1,$2,$3,$4,$5,$6,clock_timestamp()+interval '1 day')",
    [SEED_IDS.collegeA,job,SEED_IDS.collegeAdminMembership,digest,codeHash,codeSalt],
   )).rejects.toMatchObject({code:"23505"});
   await client.query("ROLLBACK TO SAVEPOINT duplicate_token_hash");
   await client.query("SAVEPOINT invalid_expiry");
   await expect(client.query(
    "insert into placement_company_applicant_shares(college_id,job_id,created_by_membership_id,token_hash,code_hash,code_salt,expires_at) values($1,$2,$3,$4,$5,$6,clock_timestamp()-interval '1 day')",
    [SEED_IDS.collegeA,job,SEED_IDS.collegeAdminMembership,createHash("sha256").update(randomUUID()).digest("hex"),codeHash,codeSalt],
   )).rejects.toMatchObject({code:"23514"});
   await client.query("ROLLBACK TO SAVEPOINT invalid_expiry");
   const events=await client.query<{count:string}>(
    "select count(*)::text as count from placement_company_applicant_share_views where share_id=$1 and event_kind='VIEW'",
    [share],
   );
   expect(events.rows[0]?.count).toBe("1");
   // The composite share/college FK must stop forged cross-tenant audit events.
   await client.query("SAVEPOINT cross_tenant_view");
   await expect(client.query(
    "insert into placement_company_applicant_share_views(share_id,college_id,event_kind) values($1,$2,'VIEW')",
    [share,SEED_IDS.collegeB],
   )).rejects.toMatchObject({code:"23503"});
   await client.query("ROLLBACK TO SAVEPOINT cross_tenant_view");
   // Audit writes must preserve the immutable event-kind vocabulary.
   await client.query("SAVEPOINT invalid_kind");
   await expect(client.query(
    "insert into placement_company_applicant_share_views(share_id,college_id,event_kind) values($1,$2,'PRINT')",
    [share,SEED_IDS.collegeA],
   )).rejects.toMatchObject({code:"23514"});
   await client.query("ROLLBACK TO SAVEPOINT invalid_kind");
   await client.query("SAVEPOINT foreign_actor");
   await expect(client.query(
    "insert into placement_company_applicant_shares(id,college_id,job_id,created_by_membership_id,token_hash,code_hash,code_salt,expires_at) values($1,$2,$3,$4,$5,$6,$7,clock_timestamp()+interval '1 day')",
    [randomUUID(),SEED_IDS.collegeA,job,SEED_IDS.facultyCollegeBMembership,
      createHash("sha256").update(randomUUID()).digest("hex"),codeHash,codeSalt],
   )).rejects.toMatchObject({code:"23503"});
   await client.query("ROLLBACK TO SAVEPOINT foreign_actor");
   await client.query("SAVEPOINT foreign_tenant");
   await expect(client.query(
    "insert into placement_company_applicant_shares(id,college_id,job_id,created_by_membership_id,token_hash,code_hash,code_salt,expires_at) values($1,$2,$3,$4,$5,$6,$7,clock_timestamp()+interval '1 day')",
    [foreignShare,SEED_IDS.collegeB,job,SEED_IDS.collegeAdminMembership,
      createHash("sha256").update(foreignShare).digest("hex"),codeHash,codeSalt],
   )).rejects.toMatchObject({code:"23503"});
   await client.query("ROLLBACK TO SAVEPOINT foreign_tenant");
   await client.query("update placement_company_applicant_shares set revoked_at=clock_timestamp() where id=$1",[share]);
   const revoked=await client.query<{count:string}>(
    "select count(*)::text as count from placement_company_applicant_shares where id=$1 and revoked_at is null and expires_at>clock_timestamp()",
    [share],
   );
   expect(revoked.rows[0]?.count).toBe("0");
   await client.query("update placement_company_applicant_shares set revoked_at=null,created_at=clock_timestamp()-interval '2 days',expires_at=clock_timestamp()-interval '1 second' where id=$1",[share]);
   const expired=await client.query<{count:string}>(
    "select count(*)::text as count from placement_company_applicant_shares where id=$1 and revoked_at is null and expires_at>clock_timestamp()",
    [share],
   );
   expect(expired.rows[0]?.count).toBe("0");
  }finally{
   await client.query("ROLLBACK");
   client.release();
   await pool.end();
  }
 });
});
