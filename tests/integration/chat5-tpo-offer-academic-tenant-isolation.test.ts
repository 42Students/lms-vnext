import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {enrichTpoOfferFacts} from "@/modules/placements/tpo-offer-academic-enrichment";
import type {listPlacementJobOffers} from "@/modules/placements/offer-service";
import {SEED_IDS} from "../../scripts/db-seed-data";

const databaseUrl=process.env.TEST_DATABASE_URL??process.env.DATABASE_URL;
if(!databaseUrl)throw new Error("TEST_DATABASE_URL or DATABASE_URL required for PostgreSQL integration");
const pool=new Pool({connectionString:databaseUrl,max:1});

afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("PLACEMENTS-OFFERS-IDOR-07: academic enrichment cannot leak a foreign college's cohort",()=>{
 it("masks cross-college program/cohort on a same-college membership, but keeps legitimate academic data",async()=>{
  const marker=randomUUID().slice(0,8);
  const identity=randomUUID(),member=randomUUID();
  const foreignProgram=randomUUID(),foreignPeriod=randomUUID(),foreignCohort=randomUUID();
  const localProgram=randomUUID(),localPeriod=randomUUID(),localCohort=randomUUID(),wrongPeriodCohort=randomUUID();
  const fake=[{candidate:{membershipId:member,displayName:"Test member"}}] as unknown as
    Awaited<ReturnType<typeof listPlacementJobOffers>>;
  try{
   await pool.query("insert into users (id,identity_uid,display_name) values($1,$2,$3)",
    [identity,"chat5-tenant-test-"+identity,"Tenant-isolation fixture"]);
   await pool.query("insert into college_memberships(id,user_id,college_id) values($1,$2,$3)",
    [member,identity,SEED_IDS.collegeA]);
   await pool.query("insert into membership_roles(membership_id,role) values($1,'LEARNER')",[member]);
   await pool.query(
    "insert into programs(id,department_id,name,code,duration_terms) values($1,$2,$3,$4,4)",
    [foreignProgram,SEED_IDS.departmentB,"Foreign academic program","B-"+marker]);
   await pool.query(
    "insert into academic_periods(id,college_id,name,code,start_date,end_date) values($1,$2,$3,$4,'2026-01-01','2026-12-31')",
    [foreignPeriod,SEED_IDS.collegeB,"Foreign academic year","BP-"+marker]);
   await pool.query("insert into cohorts(id,program_id,name,code,start_period_id) values($1,$2,$3,$4,$5)",
    [foreignCohort,foreignProgram,"DO NOT LEAK FOREIGN COHORT","BC-"+marker,foreignPeriod]);
   // DB02 now rejects the cross-college relationship on write, before any
   // TPO projection can leak it. Keep this negative tenant assertion.
   await expect(pool.query(
    "insert into learner_program_enrollments(membership_id,program_id,cohort_id) values($1,$2,$3)",
    [member,foreignProgram,foreignCohort],
   )).rejects.toMatchObject({code:"23514"});
   const foreign=await enrichTpoOfferFacts(fake,SEED_IDS.collegeA);
   expect(foreign).toHaveLength(1);
   expect(foreign[0]?.candidate.batch).toBeNull();
   expect(foreign[0]?.candidate.branch).toBeNull();
   expect(JSON.stringify(foreign)).not.toContain("DO NOT LEAK FOREIGN COHORT");

   // Swap the identical membership to a real same-college enrollment:
   // security filtering must not blank legitimately visible information.
   await pool.query(
    "insert into programs(id,department_id,name,code,duration_terms) values($1,$2,$3,$4,4)",
    [localProgram,SEED_IDS.departmentA,"Local academic program","A-"+marker]);
   await pool.query(
    "insert into academic_periods(id,college_id,name,code,start_date,end_date) values($1,$2,$3,$4,'2026-01-01','2026-12-31')",
    [localPeriod,SEED_IDS.collegeA,"Local academic year","AP-"+marker]);
   // A cohort must actually belong to the enrollment's program; an FK
   // to an unrelated foreign cohort must not expose its name or department.
   // The rejected foreign insert created no enrollment to reparent.
   // Verify the TPO view remains empty instead of constructing a corrupt row.
   const mismatched=await enrichTpoOfferFacts(fake,SEED_IDS.collegeA);
   expect(mismatched[0]?.candidate.batch).toBeNull();
   expect(mismatched[0]?.candidate.branch).toBeNull();
   expect(JSON.stringify(mismatched)).not.toContain("DO NOT LEAK FOREIGN COHORT");

   // Even a same-college program can point at a cohort whose academic-period
   // belongs to a different college. The label still cannot be exported.
   await expect(pool.query(
    "insert into cohorts(id,program_id,name,code,start_period_id) values($1,$2,$3,$4,$5)",
    [wrongPeriodCohort,localProgram,"WRONG COLLEGE START PERIOD","WC-"+marker,foreignPeriod],
   )).rejects.toThrow("Cohort program and start period must belong to one college");
   // The database blocks cross-college references; a mismatched enrollment
   // must still remain masked by the read layer.
   const foreignPeriodResult=await enrichTpoOfferFacts(fake,SEED_IDS.collegeA);
   expect(foreignPeriodResult[0]?.candidate.batch).toBeNull();
   expect(foreignPeriodResult[0]?.candidate.branch).toBeNull();
   expect(JSON.stringify(foreignPeriodResult)).not.toContain("WRONG COLLEGE START PERIOD");

   await pool.query("insert into cohorts(id,program_id,name,code,start_period_id) values($1,$2,$3,$4,$5)",
    [localCohort,localProgram,"College A Cohort","AC-"+marker,localPeriod]);
   await pool.query(
    "insert into learner_program_enrollments(membership_id,program_id,cohort_id) values($1,$2,$3)",
    [member,localProgram,localCohort]);
   const local=await enrichTpoOfferFacts(fake,SEED_IDS.collegeA);
   expect(local[0]?.candidate.batch).toBe("College A Cohort");
   expect(local[0]?.candidate.branch).toBeTruthy();
  }finally{
   await pool.query("delete from learner_program_enrollments where membership_id=$1",[member]);
   await pool.query("delete from cohorts where id=any($1::uuid[])",[[foreignCohort,localCohort,wrongPeriodCohort]]);
   await pool.query("delete from academic_periods where id=any($1::uuid[])",[[foreignPeriod,localPeriod]]);
   await pool.query("delete from programs where id=any($1::uuid[])",[[foreignProgram,localProgram]]);
   await pool.query("delete from membership_roles where membership_id=$1",[member]);
   await pool.query("delete from college_memberships where id=$1",[member]);
   await pool.query("delete from users where id=$1",[identity]);
  }
 },15000);
});
