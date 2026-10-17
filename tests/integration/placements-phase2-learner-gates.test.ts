import { publishableJobTerms } from "../support/publishable-job-terms";
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { createPlacementJob, publishPlacementJob } from "@/modules/placements/job-service";
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { upsertJobEligibilityPolicy } from "@/modules/placements/eligibility-service";
import { sweepExpiredPlacementOffers } from "@/modules/placements/placement-offer-expiry-sweep-service";
import {undoPlacementOfferCascade} from "@/modules/placements/offer-cascade-undo-service";
import {getPublicPlacementStatistics} from "@/modules/placements/public-page/read-service";
import { minimumOfferResponseDeadline } from "@/modules/placements/offer-college-rules-policy";
import { actOnPlacementOffer } from "@/modules/placements/offer-service";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import { loadPlacementHeldOfferFacts } from "@/modules/placements/held-offer-facts-service";
import { isPlacementLearnerDebarred } from "@/modules/placements/debarment-service";
import { submitOwnExternalOffer, reviewExternalOffer } from "@/modules/placements/external-offer-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

/**
 * P-S1-02/03/05/06/07: real PostgreSQL service and tenant-boundary witnesses.
 * Authored only, never claimed executed. Do not run against shared databases.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url || url !== process.env.DATABASE_URL ||
    process.env.DB08_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("Phase 2 placements integration requires the identical disposable TEST_DATABASE_URL/DATABASE_URL and DB08_ISOLATED_TEST_DATABASE=1");
}
const pool = new Pool({ connectionString: url, max: 3 });

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser, identityUid: "seed-learner",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["LEARNER"],
  },
};
const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "seed-faculty",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA, organizationId: SEED_IDS.organization,
    status: "ACTIVE", roles: ["FACULTY","TPO"],
  },
};

/** Database is disposable and isolated. Clean child records before parents. */
async function clean() {
  await pool.query("DELETE FROM in_app_notifications");
  await pool.query("DELETE FROM activity_events");
  await pool.query("DELETE FROM placement_joining_history");
  await pool.query("DELETE FROM placement_joining_outcomes");
  await pool.query("DELETE FROM placement_offer_status_history");
  await pool.query("DELETE FROM placement_offers");
  await pool.query("DELETE FROM placement_round_results");
  await pool.query("DELETE FROM placement_job_round_events");
  await pool.query("DELETE FROM placement_job_rounds");
  await pool.query("DELETE FROM placement_application_screening_history");
  await pool.query("DELETE FROM placement_application_screenings");
  await pool.query("DELETE FROM placement_application_status_history");
  await pool.query("DELETE FROM placement_applications");
  await pool.query("DELETE FROM placement_eligibility_overrides");
  await pool.query("DELETE FROM placement_job_eligibility_policies");
  await pool.query("DELETE FROM placement_candidate_academic_evidence");
  await pool.query("TRUNCATE TABLE placement_external_offer_events");
  await pool.query("DELETE FROM placement_external_offers");
  await pool.query("TRUNCATE TABLE placement_debarment_history, placement_debarment_drive_events");
  await pool.query("DELETE FROM placement_debarments");
  await pool.query("DELETE FROM placement_jobs");
  await pool.query("DELETE FROM placement_company_relationships");
  await pool.query("DELETE FROM placement_companies");
  if (extraCohorts.length) {
    await pool.query("DELETE FROM cohorts WHERE id = ANY($1::uuid[])", [extraCohorts]);
    extraCohorts.length = 0;
  }
}

const extraCohorts: string[] = [];

async function makeJob(title: string, beforePublish?: (jobId: string) => Promise<void>) {
  const uid = randomUUID();
  const company = await createPlacementCompany(tpo, {
    collegeId: SEED_IDS.collegeA,
    name: title + " " + uid,
    primaryDomain: "phase2-" + uid + ".example",
  });
  const job = await createPlacementJob(tpo, {
      ...publishableJobTerms,
    collegeId: SEED_IDS.collegeA,
    companyRelationshipId: company.relationship.id,
    title, description: "Phase 2 isolated placement acceptance",
    employmentType: "FULL_TIME", workMode: "HYBRID",
    applicationMode: "INTERNAL",
  });
  if (beforePublish) await beforePublish(job.id);
  await publishPlacementJob(tpo, job.id);
  return job;
}

beforeEach(async () => {
  await clean();
  await enableSeedLearnerPlacementAccess(pool);
  const own = await pool.query<{ cohort_id: string }>(
    "SELECT cohort_id FROM learner_program_enrollments WHERE membership_id=$1 AND status='ACTIVE' LIMIT 1",
    [SEED_IDS.learnerCollegeAMembership],
  );
  const cohortId = own.rows[0]?.cohort_id;
  if (!cohortId) throw new Error("Phase 2 fixture must have one active cohort");
  // Explicit placement consent, never inferred from the seed enrollment.
  await pool.query(`
    INSERT INTO placement_batch_registrations
      (college_id,cohort_id,membership_id,choice,consent_version,consent_at,source,recorded_by_user_id)
    VALUES ($1,$2,$3,'PLACEMENTS','phase2-test',now(),'BACKFILL',$4)
    ON CONFLICT (membership_id,cohort_id)
    DO UPDATE SET choice='PLACEMENTS',consent_version='phase2-test',
      consent_at=now(),source='BACKFILL',recorded_by_user_id=$4
  `, [SEED_IDS.collegeA, cohortId, SEED_IDS.learnerCollegeAMembership,
      SEED_IDS.collegeAdminUser]);
  await pool.query(`
    INSERT INTO placement_college_rules(college_id,max_held_offers,uplift_pct)
    VALUES($1,1,40) ON CONFLICT (college_id)
    DO UPDATE SET max_held_offers=1,uplift_pct=40
  `, [SEED_IDS.collegeA]);
});
afterAll(async () => {
  await clean();
  await pool.end();
  await closeDatabaseConnection();
});

describe("Section A: placement write/read integration boundaries", () => {
  it("P-S1-05 counts only VERIFIED off-campus offers in held capacity and apply", async () => {
    const job = await makeJob("External held cap");
    const before = await listLearnerPlacementJobs(learner);
    expect(before.find(row => row.job.id === job.id)?.canApply).toBe(true);

    const pending = await submitOwnExternalOffer(learner, {
      companyName: "External verified offer", ctcLpa: "12.50",
    });
    const unverified = await loadPlacementHeldOfferFacts(
      SEED_IDS.collegeA, SEED_IDS.learnerCollegeAMembership,
    );
    expect(unverified).toHaveLength(0);

    await reviewExternalOffer(tpo, {offerId: pending.id, action:"VERIFY"});
    const facts = await loadPlacementHeldOfferFacts(
      SEED_IDS.collegeA, SEED_IDS.learnerCollegeAMembership,
    );
    expect(facts).toContainEqual({
      kind:"OFFER",status:"ACCEPTED",annualCtcInr:1_250_000,
    });

    const listing = await listLearnerPlacementJobs(learner);
    expect(listing.find(row => row.job.id === job.id)?.canApply).toBe(false);
    await expect(applyToPlacementJob(learner, job.id, {}))
      .rejects.toMatchObject({code:"PLACEMENT_APPLICATION_INELIGIBLE"});

    await reviewExternalOffer(tpo, {
      offerId: pending.id, action:"REVOKE", reason:"External offer rescinded",
    });
    const after = await listLearnerPlacementJobs(learner);
    expect(after.find(row => row.job.id === job.id)?.canApply).toBe(true);
  });
  it("P-S1-02 enforces active debarment in the feed and application write", async () => {
    const job = await makeJob("Debarment denied drive");
    const inserted = await pool.query<{id:string}>(`
      INSERT INTO placement_debarments
        (college_id,membership_id,reason,until_date,created_by_user_id)
      VALUES($1,$2,'Policy suspension','2099-12-31',$3)
      RETURNING id
    `, [SEED_IDS.collegeA, SEED_IDS.learnerCollegeAMembership, SEED_IDS.collegeAdminUser]);
    const banId = inserted.rows[0]!.id;

    expect(await isPlacementLearnerDebarred(
      SEED_IDS.collegeA, SEED_IDS.learnerCollegeAMembership,
    )).toBe(true);
    // A college B lookup cannot re-use the same membership's college A ban.
    expect(await isPlacementLearnerDebarred(
      SEED_IDS.collegeB, SEED_IDS.learnerCollegeAMembership,
    )).toBe(false);

    const visible = await listLearnerPlacementJobs(learner);
    expect(visible.find(row => row.job.id === job.id)?.canApply).toBe(false);
    await expect(applyToPlacementJob(learner, job.id, {}))
      .rejects.toMatchObject({code:"PLACEMENT_APPLICATION_INELIGIBLE"});

    await pool.query(`
      UPDATE placement_debarments
         SET lifted_at=now(),lifted_by_user_id=$2,lifted_reason='Appeal accepted'
       WHERE id=$1
    `, [banId, SEED_IDS.collegeAdminUser]);
    expect(await isPlacementLearnerDebarred(
      SEED_IDS.collegeA, SEED_IDS.learnerCollegeAMembership,
    )).toBe(false);
    expect((await listLearnerPlacementJobs(learner))
      .find(row => row.job.id === job.id)?.canApply).toBe(true);
  });


  it("P-S1-03 enforces target cohort in both discovery and apply", async () => {
    const enrollment = await pool.query<{ program_id:string; cohort_id:string }>(
      "SELECT program_id,cohort_id FROM learner_program_enrollments WHERE membership_id=$1 AND status='ACTIVE' LIMIT 1",
      [SEED_IDS.learnerCollegeAMembership],
    );
    const own = enrollment.rows[0]!;
    const period = await pool.query<{start_period_id:string}>(
      "SELECT start_period_id FROM cohorts WHERE id=$1", [own.cohort_id],
    );
    const foreignCohortId = randomUUID();
    extraCohorts.push(foreignCohortId);
    await pool.query(`
      INSERT INTO cohorts(id,program_id,name,code,start_period_id)
      VALUES($1,$2,$3,$4,$5)
    `, [foreignCohortId, own.program_id, "Other class "+foreignCohortId,
         "P2-"+foreignCohortId,period.rows[0]!.start_period_id]);

    const restricted = await makeJob("Other cohort only", async (jobId) => {
      await upsertJobEligibilityPolicy(tpo, jobId, {
        allowedCohortIds:[foreignCohortId],
      });
    });
    expect((await listLearnerPlacementJobs(learner))
      .some(row => row.job.id === restricted.id)).toBe(false);
    await expect(applyToPlacementJob(learner, restricted.id, {}))
      .rejects.toMatchObject({code:"PLACEMENT_APPLICATION_INELIGIBLE"});

    const matching = await makeJob("Own cohort", async (jobId) => {
      await upsertJobEligibilityPolicy(tpo, jobId, {
        allowedCohortIds:[own.cohort_id],
      });
    });
    expect((await listLearnerPlacementJobs(learner))
      .some(row => row.job.id === matching.id)).toBe(true);
  });


  it("P-S2-06 applies persisted college response hours without crediting Sunday partial hours",async()=>{
    await pool.query(`
      INSERT INTO placement_college_rules (college_id,min_response_hours)
      VALUES ($1,1) ON CONFLICT (college_id)
      DO UPDATE SET min_response_hours=excluded.min_response_hours
    `,[SEED_IDS.collegeA]);
    const row=(await pool.query<{min_response_hours:number}>(
      "SELECT min_response_hours FROM placement_college_rules WHERE college_id=$1",
      [SEED_IDS.collegeA],
    )).rows[0];
    expect(row?.min_response_hours).toBe(1);
    const issuedAt=new Date("2026-10-18T18:00:00.000Z"); // Sunday 23:30 IST
    const deadline=minimumOfferResponseDeadline(issuedAt,row!.min_response_hours);
    expect(deadline.toISOString()).toBe("2026-10-18T19:30:00.000Z");
    expect(deadline.getTime()-issuedAt.getTime()).toBe(90*60_000);
  });

  it("T-S2-08 hides median/highest CTC when five offers belong to just one learner",async()=>{
    await pool.query(`
      INSERT INTO placement_public_page_settings (college_id,enabled,population_count,published_at)
      VALUES ($1,true,5,now()) ON CONFLICT (college_id)
      DO UPDATE SET enabled=true,population_count=5,published_at=now()
    `,[SEED_IDS.collegeA]);
    try{
      // Apply to all five jobs first: once an offer is held, the held-offer
      // policy (correctly) blocks further applications by the same learner.
      const apps=[];
      for(let i=0;i<5;i++){
        const job=await makeJob("CTC privacy "+i);
        apps.push(await applyToPlacementJob(learner,job.id,{}));
      }
      for(let i=0;i<5;i++){
        const app=apps[i]!;
        await pool.query(`
          INSERT INTO placement_offers
           (application_id,version,kind,status,role_title,annual_ctc_inr,issued_by_user_id,expires_at)
          VALUES ($1,1,'OFFER','ISSUED','Privacy engineer',$2,$3,now()+interval '7 days')
        `,[app.id,500_000+i*10_000,SEED_IDS.facultyUser]);
      }
      const pub=await getPublicPlacementStatistics(SEED_IDS.collegeA);
      expect(pub?.offers).toBe(5);
      expect(pub?.medianCtcInr).toBeNull();
      expect(pub?.highestCtcInr).toBeNull();
      expect(pub?.placed).toBeNull(); // one distinct placed learner
    }finally{
      await pool.query(`
        UPDATE placement_public_page_settings SET enabled=false,published_at=null
        WHERE college_id=$1
      `,[SEED_IDS.collegeA]);
    }
  });

  it("P-S1-07 persists exactly-once expiry and rejects acceptance at the deadline", async () => {
    // This is a real registered-DDL acceptance test, not a staged-schema mock.
    // An absent migration is an explicit failing prerequisite.
    const constraint = await pool.query<{definition:string}>(`
      SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint
      WHERE conname='placement_offers_status_ck'
    `);
    if (!constraint.rows.some(row => row.definition.includes("EXPIRED"))) {
      throw new Error("P-S1-07 requires registered EXPIRED status and migration replay");
    }

    const job = await makeJob("Expiry sweep");
    const application = await applyToPlacementJob(learner, job.id, {});
    const now = new Date();
    const issuedAt = new Date(now.getTime() - 72 * 3_600_000);
    const deadline = new Date(now.getTime() - 48 * 3_600_000);
    const issued = await pool.query<{id:string}>(`
      INSERT INTO placement_offers
        (application_id,version,kind,status,role_title,annual_ctc_inr,issued_by_user_id,issued_at,expires_at)
      VALUES($1,1,'OFFER','ISSUED','Expiry Engineer',1000000,$2,$3,$4)
      RETURNING id
    `, [application.id, SEED_IDS.facultyUser, issuedAt, deadline]);
    const offerId = issued.rows[0]!.id;

    await expect(actOnPlacementOffer(
      learner, offerId, {action:"ACCEPT"}, deadline,
    )).rejects.toMatchObject({code:"PLACEMENT_OFFER_EXPIRED"});

    expect(await sweepExpiredPlacementOffers(SEED_IDS.facultyUser, now)).toBe(1);
    expect(await sweepExpiredPlacementOffers(SEED_IDS.facultyUser, now)).toBe(0);
    const stored = await pool.query<{status:string}>(
      "SELECT status FROM placement_offers WHERE id=$1", [offerId],
    );
    expect(stored.rows[0]?.status).toBe("EXPIRED");
    const history = await pool.query<{from_status:string;to_status:string}>(`
      SELECT from_status,to_status FROM placement_offer_status_history
      WHERE offer_id=$1 ORDER BY created_at,id
    `, [offerId]);
    expect(history.rows).toEqual([{from_status:"ISSUED",to_status:"EXPIRED"}]);

    // Old EXPIRED version must not occupy the unique active-offer slot.
    const next = await pool.query<{id:string}>(`
      INSERT INTO placement_offers
        (application_id,version,kind,status,role_title,annual_ctc_inr,issued_by_user_id,expires_at)
      VALUES($1,2,'OFFER','ISSUED','Next version',1100000,$2,$3)
      RETURNING id
    `, [application.id, SEED_IDS.facultyUser, new Date(now.getTime()+72*3_600_000)]);
    expect(next.rows[0]?.id).toBeTruthy();
  });


  it("P-S1-07 concurrent sweep skips a locked offer then expires it once on release",async()=>{
    const job=await makeJob("Expiry locked concurrency");
    const application=await applyToPlacementJob(learner,job.id,{});
    const now=new Date();
    const stored=await pool.query<{id:string}>(`
      INSERT INTO placement_offers
        (application_id,version,kind,status,role_title,annual_ctc_inr,issued_by_user_id,issued_at,expires_at)
      VALUES ($1,1,'OFFER','ISSUED','Lock engineer',1000000,$2,$3,$4)
      RETURNING id
    `,[application.id,SEED_IDS.facultyUser,new Date(now.getTime()-86_400_000),new Date(now.getTime()-1000)]);
    const offerId=stored.rows[0]!.id;
    const blocker=await pool.connect();
    try{
      await blocker.query("BEGIN");
      await blocker.query("SELECT id FROM placement_offers WHERE id=$1 FOR UPDATE",[offerId]);
      expect(await sweepExpiredPlacementOffers(SEED_IDS.facultyUser,now)).toBe(0);
    }finally{
      await blocker.query("ROLLBACK");
      blocker.release();
    }
    const [first,second]=await Promise.all([
      sweepExpiredPlacementOffers(SEED_IDS.facultyUser,now),
      sweepExpiredPlacementOffers(SEED_IDS.facultyUser,now),
    ]);
    expect(first+second).toBe(1);
    expect((await pool.query<{status:string}>(
      "SELECT status FROM placement_offers WHERE id=$1",[offerId],
    )).rows[0]?.status).toBe("EXPIRED");
    expect((await pool.query<{n:number}>(
      "SELECT count(*)::int n FROM placement_offer_status_history WHERE offer_id=$1 AND to_status='EXPIRED'",
      [offerId],
    )).rows[0]?.n).toBe(1);
  });

  it("P-S1-06 accept cascade declines sibling offers and withdraws sibling applications atomically", async () => {
    const first = await makeJob("Accepted primary");
    const second = await makeJob("Withdrawn sibling");
    const applicationA = await applyToPlacementJob(learner, first.id, {});
    const applicationB = await applyToPlacementJob(learner, second.id, {});
    const deadline = new Date(Date.now()+7*24*3_600_000);
    const createOffer = async (applicationId:string, version:number, ctc:number) => {
      const row = await pool.query<{id:string}>(`
        INSERT INTO placement_offers
          (application_id,version,kind,status,role_title,annual_ctc_inr,issued_by_user_id,expires_at)
        VALUES($1,$2,'OFFER','ISSUED','Placement Engineer',$3,$4,$5)
        RETURNING id
      `, [applicationId, version, ctc, SEED_IDS.facultyUser, deadline]);
      return row.rows[0]!.id;
    };
    const chosenId = await createOffer(applicationA.id, 1, 1_500_000);
    const siblingId = await createOffer(applicationB.id, 1, 1_800_000);

    const accepted = await actOnPlacementOffer(learner, chosenId, {action:"ACCEPT"});
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted).toMatchObject({cascadeId:expect.any(String)});

    const live = await pool.query<{id:string;status:string}>(`
      SELECT id,status FROM placement_offers WHERE id=ANY($1::uuid[])
    `, [[chosenId,siblingId]]);
    expect(live.rows.find(x=>x.id===chosenId)?.status).toBe("ACCEPTED");
    expect(live.rows.find(x=>x.id===siblingId)?.status).toBe("DECLINED");

    const application = await pool.query<{status:string}>(`
      SELECT status FROM placement_applications WHERE id=$1
    `, [applicationB.id]);
    expect(application.rows[0]?.status).toBe("WITHDRAWN");

    const acceptedHistory = await pool.query<{reason:string|null}>(`
      SELECT reason FROM placement_offer_status_history
      WHERE offer_id=$1 AND to_status='ACCEPTED'
    `, [chosenId]);
    const reason = acceptedHistory.rows[0]?.reason;
    expect(reason).toMatch(/^cascade:[0-9a-f-]{36}$/);
    const token = reason!.slice("cascade:".length);
    const siblingHistory = await pool.query<{reason:string|null}>(`
      SELECT reason FROM placement_offer_status_history
      WHERE offer_id=$1 AND to_status='DECLINED'
    `, [siblingId]);
    expect(siblingHistory.rows[0]?.reason).toBe("placed elsewhere; cascade:"+token);
    const applicationHistory = await pool.query<{reason:string|null}>(`
      SELECT reason FROM placement_application_status_history
      WHERE application_id=$1 AND to_status='WITHDRAWN'
    `, [applicationB.id]);
    expect(applicationHistory.rows[0]?.reason).toBe("placed elsewhere; cascade:"+token);

    // A retry cannot create a second cascade or duplicate sibling history.
    const repeated = await actOnPlacementOffer(learner, chosenId, {action:"ACCEPT"});
    expect(repeated).toMatchObject({status:"ACCEPTED",cascadeId:token});
    const count = await pool.query<{count:number}>(`
      SELECT count(*)::int AS count FROM placement_offer_status_history
      WHERE offer_id=$1 AND to_status='DECLINED'
    `, [siblingId]);
    expect(count.rows[0]?.count).toBe(1);

    // An explicit TPO compensation restores the accepted offer and all
    // cohort-scoped cascade effects in a single transaction.
    const undone=await undoPlacementOfferCascade(tpo,chosenId,token);
    expect(undone).toMatchObject({
      cascadeId:token,alreadyUndone:false,restoredApplications:1,restoredOffers:1,
    });
    const restored=(await pool.query<{id:string;status:string}>(
      "SELECT id,status FROM placement_offers WHERE id=ANY($1::uuid[])",
      [[chosenId,siblingId]],
    )).rows;
    expect(restored.find(x=>x.id===chosenId)?.status).toBe("ISSUED");
    expect(restored.find(x=>x.id===siblingId)?.status).toBe("ISSUED");
    expect((await pool.query<{status:string;withdrawn_at:Date|null}>(
      "SELECT status,withdrawn_at FROM placement_applications WHERE id=$1",
      [applicationB.id],
    )).rows[0]).toMatchObject({status:"SUBMITTED",withdrawn_at:null});
    expect(await undoPlacementOfferCascade(tpo,chosenId,token))
      .toMatchObject({alreadyUndone:true,restoredApplications:0,restoredOffers:0});
    await expect(undoPlacementOfferCascade(tpo,chosenId,randomUUID())).rejects.toBeDefined();
  });


  it("LEARNER-placements-R03 accepting an internship never withdraws another live application or offer",async()=>{
    const internship=await makeJob("Internship accepted");
    const other=await makeJob("Full-time opportunity");
    const internApplication=await applyToPlacementJob(learner,internship.id,{});
    const otherApplication=await applyToPlacementJob(learner,other.id,{});
    // Simulate the persisted internship classification independently from role titles.
    await pool.query("UPDATE placement_jobs SET employment_type='INTERNSHIP' WHERE id=$1",[internship.id]);
    const expiresAt=new Date(Date.now()+7*24*3_600_000);
    const create=async(applicationId:string,ctc:number)=>(await pool.query<{id:string}>(`
      INSERT INTO placement_offers
        (application_id,version,kind,status,role_title,annual_ctc_inr,issued_by_user_id,expires_at)
      VALUES ($1,1,'OFFER','ISSUED','Candidate offer',$2,$3,$4) RETURNING id
    `,[applicationId,ctc,SEED_IDS.facultyUser,expiresAt])).rows[0]!.id;
    const acceptedId=await create(internApplication.id,300000);
    const siblingId=await create(otherApplication.id,900000);
    await actOnPlacementOffer(learner,acceptedId,{action:"ACCEPT"});
    expect((await pool.query<{status:string}>(
      "SELECT status FROM placement_applications WHERE id=$1",[otherApplication.id],
    )).rows[0]?.status).toBe("SUBMITTED");
    expect((await pool.query<{status:string}>(
      "SELECT status FROM placement_offers WHERE id=$1",[siblingId],
    )).rows[0]?.status).toBe("ISSUED");
  });

  it("LEARNER-placements-R03 retains a Dream drive and its offer after another offer is accepted",async()=>{
    const chosen=await makeJob("Accepted full-time offer");
    const dream=await makeJob("Dream upgrade still eligible");
    await pool.query("UPDATE placement_jobs SET is_dream=true WHERE id=$1",[dream.id]);
    const chosenApplication=await applyToPlacementJob(learner,chosen.id,{});
    const dreamApplication=await applyToPlacementJob(learner,dream.id,{});
    const expiresAt=new Date(Date.now()+7*24*3_600_000);
    const create=async(applicationId:string,ctc:number)=>(await pool.query<{id:string}>(`
      INSERT INTO placement_offers
        (application_id,version,kind,status,role_title,annual_ctc_inr,issued_by_user_id,expires_at)
      VALUES ($1,1,'OFFER','ISSUED','Candidate offer',$2,$3,$4) RETURNING id
    `,[applicationId,ctc,SEED_IDS.facultyUser,expiresAt])).rows[0]!.id;
    const chosenId=await create(chosenApplication.id,1000000);
    const dreamOfferId=await create(dreamApplication.id,1200000);
    await actOnPlacementOffer(learner,chosenId,{action:"ACCEPT"});
    expect((await pool.query<{status:string}>(
      "SELECT status FROM placement_applications WHERE id=$1",[dreamApplication.id],
    )).rows[0]?.status).toBe("SUBMITTED");
    expect((await pool.query<{status:string}>(
      "SELECT status FROM placement_offers WHERE id=$1",[dreamOfferId],
    )).rows[0]?.status).toBe("ISSUED");
  });

});
