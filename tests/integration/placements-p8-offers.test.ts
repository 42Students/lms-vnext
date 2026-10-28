import {randomUUID} from "node:crypto";
import { publishableJobTerms } from "../support/publishable-job-terms";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { createPlacementCompany } from "@/modules/placements/company-service";
import {
  createPlacementJob,
  closePlacementJob,
} from "@/modules/placements/job-service";
import { publishPreparedPlacementJob } from "../support/publishable-job-fixture";
import {
  actOnPlacementOffer,
  issuePlacementOffer,
  listOwnPlacementOffers,
  recordPlacementJoiningOutcome,
} from "@/modules/placements/offer-service";
import {
  actOnPlacementRound,
  createPlacementRound,
} from "@/modules/placements/round-service";
import {
  applyPlacementRoundResult,
  stagePlacementRoundResult,
} from "@/modules/placements/result-service";
import { decidePlacementScreening } from "@/modules/placements/screening-service";
import { recordTpoDriveSelections,verifyAndReleaseTpoSelections } from "@/modules/placements/tpo-drive-selection-service";
import {getTpoDriveClosePreview,closeTpoDriveWithPreview} from "@/modules/placements/tpo-drive-close-preview-service";
import {recordTpoOfferLifecycle,finalizeMaturedExternalTpoAcceptances} from "@/modules/placements/tpo-offer-lifecycle-service";
import {createOwnTpoGeneralRequest,decideTpoGeneralRequest,listOwnTpoGeneralRequestsPage}
 from "@/modules/placements/tpo-general-request-service";
import {getOwnUnifiedLearnerRequests} from "@/modules/placements/learner-support-request-service";
import {getTpoJoiningTracker} from "@/modules/placements/tpo-joining-tracker-service";
import {isoDateInIndia} from "@/modules/placements/tpo-offer-expiry-model";
import {getTpoDriveOfferRegister,getTpoDriveOfferRegisterCsv} from "@/modules/placements/tpo-drive-offer-register-service";
import {getTpoOfferEvidence} from "@/modules/placements/tpo-offer-evidence-service";
import {sweepExpiredPlacementOffers} from "@/modules/placements/placement-offer-expiry-sweep-service";
import {escalatePendingWithdrawalRequests} from "@/modules/placements/tpo-withdrawal-escalation-service";
import {getTpoWaitlistPreview,offerToNextWaitlisted} from "@/modules/placements/tpo-waitlist-promotion-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});
const testTpoRoleId=randomUUID();

const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser,
    identityUid: "seed-shared-faculty",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY", "TPO"],
  },
};

const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "seed-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function cleanup() {
  await pool.query(
    "delete from in_app_notifications",
  );
  await pool.query(
    "delete from activity_events",
  );
  // General request decisions and their append-only events can retain
  // offer references in payload; dispose of them before offer fixtures.
  await pool.query("delete from placement_learner_general_request_events");
  await pool.query("delete from placement_learner_general_requests");
  await pool.query("delete from placement_drive_selections");
  await pool.query("delete from placement_waitlist_promotions");
  await pool.query(
    "delete from placement_joining_history",
  );
  await pool.query(
    "delete from placement_joining_outcomes",
  );
  await pool.query(
    "delete from placement_offer_status_history",
  );
  await pool.query(
    "delete from placement_offers",
  );
  await pool.query("delete from placement_tpo_application_stages");
  await pool.query("delete from placement_round_candidate_slots");
  await pool.query(
    "delete from placement_round_results",
  );
  await pool.query(
    "delete from placement_job_round_events",
  );
  await pool.query(
    "delete from placement_job_rounds",
  );
  await pool.query(
    "delete from placement_application_screening_history",
  );
  await pool.query(
    "delete from placement_application_screenings",
  );
  await pool.query(
    "delete from placement_application_status_history",
  );
  await pool.query("delete from placement_learner_requests");
  // Stage projections and their immutable history hold non-cascading FKs to
  // applications. Clear those disposable fixtures before their parent rows.
  await pool.query("delete from placement_college_application_stage_history");
  await pool.query("delete from placement_college_application_stages");
  await pool.query(
    "delete from placement_applications",
  );
  await pool.query(
    "delete from placement_eligibility_overrides",
  );
  await pool.query(
    "delete from placement_job_eligibility_policies",
  );
  await pool.query(
    "delete from placement_candidate_academic_evidence",
  );
  await pool.query("delete from placement_jobs");
  await pool.query(
    "delete from placement_recruiter_college_grants",
  );
  await pool.query(
    "delete from placement_recruiter_profiles",
  );
  await pool.query(
    "delete from placement_company_relationships",
  );
  await pool.query(
    "delete from placement_companies",
  );
}

async function preparePassedApplication() {
  const company =
    await createPlacementCompany(tpo, {
      collegeId: SEED_IDS.collegeA,
      name: "Offer Systems",
      primaryDomain:
        "offer-systems.example",
    });

  const job = await createPlacementJob(
    tpo,
    {
    ...publishableJobTerms,
      collegeId: SEED_IDS.collegeA,
      companyRelationshipId:
        company.relationship.id,
      title: "Offer Engineer",
      description:
        "Offer lifecycle fixture",
      employmentType: "FULL_TIME",
      workMode: "HYBRID",
      applicationMode: "INTERNAL",
    },
  );

  const round =
    await createPlacementRound(
      tpo,
      job.id,
      {
        kind: "INTERVIEW",
        name: "Final interview",
      },
    );

  await publishPreparedPlacementJob(
    tpo,
    job.id,
  );

  const application =
    await applyToPlacementJob(
      learner,
      job.id,
      {},
    );

  await decidePlacementScreening(
    tpo,
    application.id,
    {
      decision: "SHORTLISTED",
      candidateMessage:
        "Shortlisted for the final interview",
    },
  );

  await actOnPlacementRound(
    tpo,
    round.id,
    {
      action: "SCHEDULE",
      scheduledAt: new Date(
        "2099-10-24T04:30:00.000Z",
      ),
      timezone: "Asia/Kolkata",
      mode: "VIRTUAL",
      meetingUrl:
        "https://meet.example/final",
    },
  );

  await actOnPlacementRound(
    tpo,
    round.id,
    { action: "COMPLETE" },
  );

  const staged =
    await stagePlacementRoundResult(
      tpo,
      round.id,
      {
        applicationId:
          application.id,
        outcome: "PASS",
        scorePercent: 92,
      },
    );

  await applyPlacementRoundResult(
    tpo,
    staged.id,
  );

  return {
    company,
    job,
    round,
    application,
  };
}

// External TPO acceptance is provisional for 48 hours. Only the scheduler's
// maturity step may cascade a disputed/recorded acceptance into placement.
async function matureRecordedAcceptance(offerId:string) {
  await pool.query(
    "update placement_offers set accepted_disputable_until=now()-interval '1 minute' where id=$1 and status='ACCEPTED' and acceptance_channel='EXTERNAL_IMPORT'",
    [offerId],
  );
  const sweep=await finalizeMaturedExternalTpoAcceptances(SEED_IDS.facultyUser,new Date(),10);
  expect(sweep.finalized).toBe(1);
  expect(sweep.failed).toBe(0);
}

beforeEach(async () => {
  await cleanup();
  await enableSeedLearnerPlacementAccess(pool);
  // Base seed intentionally grants FACULTY, not TPO. The placement suite
  // explicitly provisions the persisted TPO role so actor revalidation checks
  // cannot be bypassed by trusting only the RequestContext roles array.
  await pool.query(
    "insert into membership_roles(id,membership_id,role) values($1,$2,'TPO') on conflict(membership_id,role) do nothing",
    [testTpoRoleId,SEED_IDS.facultyCollegeAMembership],
  );
}, 30000);

afterAll(async () => {
  await cleanup();
  await pool.query("delete from membership_roles where id=$1",[testTpoRoleId]);
  await pool.end();
  await closeDatabaseConnection();
});

describe("Placement P8 offers and joining", () => {
  it("LEARNER-GENERAL-HISTORY-DB pages beyond 100 requests without leaking another member",async()=>{
    // Create entirely disposable request rows against the seeded authorized
    // learner. Each unique target avoids the real pending dedupe constraint.
    // None of these test records carries an uploaded private proof URL.
    const result=await pool.query(`
      insert into placement_learner_general_requests
       (college_id,membership_id,kind,target_key,reason,payload,status,requested_by_user_id)
      select $1,$2,'CORRECTION_WITH_PROOF','EDUCATION:history-'||g.i,
       'Please review this older education record '||g.i,
       jsonb_build_object('section','EDUCATION','field','history-'||g.i,
        'proposedValue','Reviewed','proofUrl','https://example.edu/proof'),
       'PENDING',$3
      from generate_series(1,105) as g(i)
      returning id`,
      [SEED_IDS.collegeA,SEED_IDS.learnerCollegeAMembership,SEED_IDS.learnerUser]);
    expect(result.rowCount).toBe(105);
    const first=await listOwnTpoGeneralRequestsPage(learner,{page:1,pageSize:20});
    const last=await listOwnTpoGeneralRequestsPage(learner,{page:6,pageSize:20});
    expect(first.total).toBe(105);
    expect(first.totalPages).toBe(6);
    expect(first.requests).toHaveLength(20);
    expect(last.total).toBe(105);
    expect(last.requests).toHaveLength(5);
    const all=new Set<string>();
    for(let page=1;page<=6;page+=1){
      const pageOfRows=await listOwnTpoGeneralRequestsPage(learner,{page,pageSize:20});
      expect(pageOfRows.total).toBe(105);
      for(const request of pageOfRows.requests){
        expect(all.has(request.id)).toBe(false);
        all.add(request.id);
      }
    }
    expect(all.size).toBe(105);
    const secondPage=await listOwnTpoGeneralRequestsPage(learner,{page:7,pageSize:20});
    expect(secondPage.requests).toHaveLength(0);
    expect(secondPage.totalPages).toBe(6);

    // The combined Learner support page previously saw only the latest 100
    // general requests, silently losing the last five and showing wrong totals.
    const mergedFirst=await getOwnUnifiedLearnerRequests(learner,{page:1});
    expect(mergedFirst.total).toBe(105);
    expect(mergedFirst.totalPages).toBe(6);
    expect(mergedFirst.items).toHaveLength(20);
    expect(mergedFirst.generalAvailable).toBe(true);
    const mergedLast=await getOwnUnifiedLearnerRequests(learner,{page:6});
    expect(mergedLast.total).toBe(105);
    expect(mergedLast.items).toHaveLength(5);
    const mergedIds=new Set<string>();
    for(let page=1;page<=6;page++){
      const history=await getOwnUnifiedLearnerRequests(learner,{page});
      for(const item of history.items){
        expect(item.source).toBe("GENERAL");
        expect(mergedIds.has(item.id)).toBe(false);
        mergedIds.add(item.id);
      }
    }
    expect(mergedIds.size).toBe(105);
    const filtered=await getOwnUnifiedLearnerRequests(learner,{
      status:"PENDING",type:"CORRECTION_WITH_PROOF",page:999,
    });
    expect(filtered.page).toBe(6);
    expect(filtered.items).toHaveLength(5);
    expect(filtered.total).toBe(105);
    const excluded=await getOwnUnifiedLearnerRequests(learner,{
      status:"APPROVED",type:"CORRECTION_WITH_PROOF",
    });
    expect(excluded.total).toBe(0);
    expect(excluded.items).toHaveLength(0);
    await expect(getOwnUnifiedLearnerRequests(tpo,{})).rejects.toThrow();

    // Add a real specialized request to the same learner feed and prove
    // source-specific labels, stable merged order, and both type filters.
    const {application}=await preparePassedApplication();
    const specialized=await pool.query<{id:string}>(`
      insert into placement_learner_requests
        (application_id,learner_membership_id,request_type,scope_key,reason,
         requested_by_user_id,requested_at)
      values($1,$2,'APPLICATION_WITHDRAWAL',$3,
        'Need to withdraw this application',$4,now()+interval '2 minutes')
      returning id`,
      [application.id,SEED_IDS.learnerCollegeAMembership,
        "history-mixed-"+randomUUID(),SEED_IDS.learnerUser]);
    expect(specialized.rows).toHaveLength(1);
    const merged=await getOwnUnifiedLearnerRequests(learner,{page:1});
    expect(merged.total).toBe(106);
    expect(merged.items[0]).toMatchObject({
      id:specialized.rows[0]!.id,source:"PLACEMENT",
      type:"APPLICATION_WITHDRAWAL",status:"PENDING",jobTitle:"Offer Engineer",
    });
    expect(merged.items[0]!.updatedAt).toBeInstanceOf(Date);
    const specializedOnly=await getOwnUnifiedLearnerRequests(learner,{
      type:"APPLICATION_WITHDRAWAL",
    });
    expect(specializedOnly.total).toBe(1);
    expect(specializedOnly.items).toHaveLength(1);
    const generalOnly=await getOwnUnifiedLearnerRequests(learner,{
      type:"CORRECTION_WITH_PROOF",page:6,
    });
    expect(generalOnly.total).toBe(105);
    expect(generalOnly.items).toHaveLength(5);
    expect(generalOnly.items.every(item=>item.source==="GENERAL")).toBe(true);
  });

  it("TPO-GENERAL-ACCEPTANCE-DISPUTE-DB restores only a timely provisional offer",async()=>{
    const {job,application}=await preparePassedApplication();
    const offer=await issuePlacementOffer(tpo,application.id,{
      roleTitle:"External acceptance disputed engineer",annualCtcInr:900_000,
    });
    await recordTpoOfferLifecycle(tpo,job.id,{
      confirmed:true,action:"RECORD_ACCEPTED",offerIds:[offer.id],
      expectedStatus:"ISSUED",
      reason:"Employer spreadsheet reported learner consent",
    });
    const request=await createOwnTpoGeneralRequest(learner,{
      kind:"OFFER_ACCEPTANCE_DISPUTE",offerId:offer.id,
      reason:"I never accepted the externally reported offer",
    });
    expect(request.replayed).toBe(false);
    const before=await pool.query<{version:string,status:string}>(`
      select version,status from placement_learner_general_requests where id=$1`,[request.id]);
    expect(before.rows[0]?.status).toBe("PENDING");
    const version=before.rows[0]!.version;

    // Construct the real temporal edge condition: dispute was submitted
    // before cutoff but the TPO is reviewing it after cutoff. The maturation
    // worker must refuse to finalize while this dispute remains pending.
    await pool.query(`
      update placement_learner_general_requests
      set requested_at=now()-interval '2 minutes' where id=$1`,[request.id]);
    await pool.query(`
      update placement_offers set accepted_disputable_until=now()-interval '1 minute'
      where id=$1 and cascade_id is null`,[offer.id]);
    const pendingMaturity=await finalizeMaturedExternalTpoAcceptances(
      SEED_IDS.facultyUser,new Date(),10);
    expect(pendingMaturity.finalized).toBe(0);
    expect(pendingMaturity.failed).toBe(0);
    const stillAccepted=await pool.query<{status:string,cascade_id:string|null}>(`
      select status,cascade_id from placement_offers where id=$1`,[offer.id]);
    expect(stillAccepted.rows[0]).toMatchObject({
      status:"ACCEPTED",cascade_id:null,
    });

    const approved=await decideTpoGeneralRequest(tpo,request.id,{
      confirmed:true,version,action:"APPROVE",
      note:"Verified that the employer recorded acceptance in error",
    });
    expect(approved.status).toBe("APPROVED");
    expect(approved.effect).toMatchObject({
      effect:"EXTERNAL_ACCEPTANCE_REVERSED",id:offer.id,
    });
    const actual=await pool.query<{
      status:string;acceptance_channel:string|null;responded_at:Date|null;
      responded_by_user_id:string|null;accepted_disputable_until:Date|null;
      cascade_id:string|null;row_version:number;expires_at:Date;
    }>(`
      select status,acceptance_channel,responded_at,responded_by_user_id,
       accepted_disputable_until,cascade_id,row_version,expires_at
      from placement_offers where id=$1`,[offer.id]);
    expect(actual.rows[0]).toMatchObject({
      status:"ISSUED",acceptance_channel:null,responded_at:null,
      responded_by_user_id:null,accepted_disputable_until:null,cascade_id:null,
    });
    expect(actual.rows[0]!.row_version).toBeGreaterThan(1);
    expect(new Date(actual.rows[0]!.expires_at).getTime()).toBeGreaterThan(
      Date.now()+47*60*60*1000);
    const history=await pool.query<{from_status:string;to_status:string}>(`
      select from_status,to_status from placement_offer_status_history
      where offer_id=$1 order by created_at desc,id desc limit 1`,[offer.id]);
    expect(history.rows[0]).toEqual({from_status:"ACCEPTED",to_status:"ISSUED"});
    const saved=await pool.query<{status:string}>(`
      select status from placement_learner_general_requests where id=$1`,[request.id]);
    expect(saved.rows[0]?.status).toBe("APPROVED");
    const notices=await pool.query<{count:number}>(`
      select count(*)::int as count from in_app_notifications
      where user_id=$1 and title='Placement request approved'`,
      [SEED_IDS.learnerUser]);
    expect(notices.rows[0]?.count).toBeGreaterThanOrEqual(1);
    await expect(decideTpoGeneralRequest(tpo,request.id,{
      confirmed:true,version,action:"APPROVE",note:"Duplicate",
    })).rejects.toMatchObject({code:"STALE"});
    const finalized=await finalizeMaturedExternalTpoAcceptances(
      SEED_IDS.facultyUser,new Date(Date.now()+72*60*60*1000),10);
    expect(finalized.finalized).toBe(0);
  });

  it("TPO-GENERAL-ACCEPTANCE-DISPUTE-DB refuses finalized offer without approving request",async()=>{
    const {job,application}=await preparePassedApplication();
    const offer=await issuePlacementOffer(tpo,application.id,{
      roleTitle:"No cascade reversal engineer",annualCtcInr:900_000,
    });
    await recordTpoOfferLifecycle(tpo,job.id,{
      confirmed:true,action:"RECORD_ACCEPTED",offerIds:[offer.id],
      expectedStatus:"ISSUED",reason:"External acceptance evidence from employer",
    });
    const request=await createOwnTpoGeneralRequest(learner,{
      kind:"OFFER_ACCEPTANCE_DISPUTE",offerId:offer.id,
      reason:"The company did not confirm my acceptance",
    });
    const persisted=await pool.query<{version:string}>(`
      select version from placement_learner_general_requests where id=$1`,[request.id]);
    // Simulate a conflicting finalized outcome; the specialist restoration
    // path must handle its cascade, not this provisional reversal.
    await pool.query(`
      update placement_offers set cascade_id=$2 where id=$1`,
      [offer.id,randomUUID()]);
    await expect(decideTpoGeneralRequest(tpo,request.id,{
      confirmed:true,version:persisted.rows[0]!.version,
      action:"APPROVE",note:"Cannot undo a finalized placement with this action",
    })).rejects.toMatchObject({code:"TARGET_CHANGED"});
    const [decision,offerState]=await Promise.all([
      pool.query<{status:string}>(`
       select status from placement_learner_general_requests where id=$1`,[request.id]),
      pool.query<{status:string}>(`select status from placement_offers where id=$1`,[offer.id]),
    ]);
    expect(decision.rows[0]?.status).toBe("PENDING");
    expect(offerState.rows[0]?.status).toBe("ACCEPTED");
  });

  it("TPO-GENERAL-ACCEPTANCE-DISPUTE-DB refuses a newly filed dispute after cutoff",async()=>{
    const {job,application}=await preparePassedApplication();
    const offer=await issuePlacementOffer(tpo,application.id,{
      roleTitle:"Past dispute window engineer",annualCtcInr:900_000,
    });
    await recordTpoOfferLifecycle(tpo,job.id,{
      confirmed:true,action:"RECORD_ACCEPTED",offerIds:[offer.id],
      expectedStatus:"ISSUED",reason:"Employer recorded acceptance",
    });
    await pool.query(`
      update placement_offers set accepted_disputable_until=now()-interval '1 minute'
      where id=$1`,[offer.id]);
    await expect(createOwnTpoGeneralRequest(learner,{
      kind:"OFFER_ACCEPTANCE_DISPUTE",offerId:offer.id,
      reason:"I dispute this late record",
    })).rejects.toMatchObject({code:"TARGET_CHANGED"});
    const requests=await pool.query<{count:number}>(`
      select count(*)::int as count from placement_learner_general_requests
      where membership_id=$1 and kind='OFFER_ACCEPTANCE_DISPUTE'
        and target_key=$2`,
      [SEED_IDS.learnerCollegeAMembership,offer.id]);
    expect(requests.rows[0]?.count).toBe(0);
  });

  it("PLACEMENTS-EXPIRY-NOTIFY-31 DB records expiry without alerting learner who disabled application notices",async()=>{
    const prior=await pool.query<{notify_application_updates:boolean}>(`
      select notify_application_updates from placement_candidate_preferences
      where membership_id=$1`,[SEED_IDS.learnerCollegeAMembership]);
    await pool.query(`
      insert into placement_candidate_preferences(membership_id,notify_application_updates)
      values($1,false)
      on conflict(membership_id) do update set notify_application_updates=false`,
      [SEED_IDS.learnerCollegeAMembership]);
    try{
      const {application}=await preparePassedApplication();
      const expiry=new Date("2099-10-24T18:29:59.000Z");
      const offer=await issuePlacementOffer(tpo,application.id,{
        roleTitle:"Respect notifications",annualCtcInr:900_000,expiresAt:expiry,
      });
      expect(await sweepExpiredPlacementOffers(SEED_IDS.facultyUser,expiry,10)).toBe(1);
      const audits=await pool.query<{id:string}>(`
        select id from activity_events where dedupe_key=$1`,
        ["placement-offer-expired:"+offer.id]);
      expect(audits.rows).toHaveLength(1);
      const notifications=await pool.query<{count:number}>(`
        select count(*)::int as count from in_app_notifications where event_id=$1`,
        [audits.rows[0]!.id]);
      expect(notifications.rows[0]?.count).toBe(0);
      const offerState=await pool.query<{status:string}>(`
        select status from placement_offers where id=$1`,[offer.id]);
      expect(offerState.rows).toEqual([{status:"EXPIRED"}]);
    }finally{
      if(prior.rows.length)await pool.query(`
        update placement_candidate_preferences set notify_application_updates=$2 where membership_id=$1`,
        [SEED_IDS.learnerCollegeAMembership,prior.rows[0]!.notify_application_updates]);
      else await pool.query("delete from placement_candidate_preferences where membership_id=$1",
        [SEED_IDS.learnerCollegeAMembership]);
    }
  });

  it("PLACEMENTS-EXPIRY-NOTIFY-30 DB records and notifies exactly once after offer deadline, never from a GET",async()=>{
    const {application}=await preparePassedApplication();
    const expiresAt=new Date("2099-10-24T18:29:59.000Z");
    const issued=await issuePlacementOffer(tpo,application.id,{
      roleTitle:"Expiry notice engineer",annualCtcInr:900_000,expiresAt,
    });
    const before=await pool.query<{count:number}>(`
      select count(*)::int as count from activity_events where
      dedupe_key=$1`,["placement-offer-expired:"+issued.id]);
    expect(before.rows[0]?.count).toBe(0);
    expect(await sweepExpiredPlacementOffers(SEED_IDS.facultyUser,expiresAt,100)).toBe(1);
    expect(await sweepExpiredPlacementOffers(SEED_IDS.facultyUser,
      new Date(expiresAt.getTime()+3600_000),100)).toBe(0);
    const persisted=await pool.query<{status:string}>(`
      select status from placement_offers where id=$1`,[issued.id]);
    expect(persisted.rows).toEqual([{status:"EXPIRED"}]);
    const history=await pool.query<{count:number}>(`
      select count(*)::int as count from placement_offer_status_history
      where offer_id=$1 and to_status='EXPIRED'`,[issued.id]);
    expect(history.rows[0]?.count).toBe(1);
    const events=await pool.query<{id:string;subject_id:string}>(`
      select id,subject_id from activity_events where
      event_type='PLACEMENTS_OFFER_EXPIRED' and dedupe_key=$1`,
      ["placement-offer-expired:"+issued.id]);
    expect(events.rows).toHaveLength(1);
    expect(events.rows[0]?.subject_id).toBe(issued.id);
    const notices=await pool.query<{user_id:string}>(`
      select user_id from in_app_notifications where event_id=$1`,
      [events.rows[0]!.id]);
    expect(notices.rows).toEqual([{user_id:SEED_IDS.learnerUser}]);
  });

  it("PLACEMENTS-EXPIRY-RACE-05 DB serializes sweep versus same-offer learner acceptance into one terminal outcome",async()=>{
    const {application}=await preparePassedApplication();
    const expiry=new Date("2099-10-19T18:29:59.000Z");
    const issued=await issuePlacementOffer(tpo,application.id,{
      roleTitle:"Offer expiry concurrency engineer",annualCtcInr:900_000,
      expiresAt:expiry,
    });
    const responseInstant=new Date(expiry.getTime()-1);
    const outcomes=await Promise.allSettled([
      sweepExpiredPlacementOffers(SEED_IDS.facultyUser,expiry,100),
      actOnPlacementOffer(learner,issued.id,{action:"ACCEPT"},responseInstant),
    ]);
    expect(outcomes.some(outcome=>outcome.status==="fulfilled")).toBe(true);
    const persisted=await pool.query<{status:string}>(
      "select status from placement_offers where id=$1",[issued.id]);
    expect(["ACCEPTED","EXPIRED"]).toContain(persisted.rows[0]?.status);
    const terminalHistory=await pool.query<{to_status:string;count:number}>(
      `select to_status,count(*)::integer as count from placement_offer_status_history
       where offer_id=$1 and to_status in ('ACCEPTED','EXPIRED')
       group by to_status`,[issued.id],
    );
    expect(terminalHistory.rows.reduce((total,row)=>total+row.count,0)).toBe(1);
    expect(terminalHistory.rows[0]?.to_status).toBe(persisted.rows[0]?.status);
    if(persisted.rows[0]?.status==="ACCEPTED"){
      expect(outcomes[1]?.status).toBe("fulfilled");
      expect(outcomes[0]?.status).toBe("fulfilled");
      if(outcomes[0]?.status==="fulfilled")expect(outcomes[0].value).toBe(0);
    }else{
      expect(outcomes[0]?.status).toBe("fulfilled");
      if(outcomes[0]?.status==="fulfilled")expect(outcomes[0].value).toBe(1);
      expect(outcomes[1]?.status).toBe("rejected");
    }
  });

  it("PLACEMENTS-EXPIRY-SM-04 DB entrypoint rejects an invalid sweep clock or unsafe batch limit before any writes",async()=>{
    await expect(sweepExpiredPlacementOffers(SEED_IDS.facultyUser,new Date(Number.NaN)))
      .rejects.toThrow("Invalid offer sweep reference date");
    for(const limit of [0,-1,101,0.5]){
      await expect(sweepExpiredPlacementOffers(SEED_IDS.facultyUser,new Date(),limit))
        .rejects.toThrow("Invalid offer sweep batch size");
    }
    const after=await pool.query<{count:number}>(
      "select count(*)::int as count from placement_offer_status_history where to_status='EXPIRED'");
    expect(after.rows[0]?.count).toBe(0);
  });

  it("TPO-2ND-PAGE-OFFERS-DB-01 protects live register and export against a foreign-college actor",async()=>{
    const {job,application}=await preparePassedApplication();
    const offer=await issuePlacementOffer(tpo,application.id,{
      roleTitle:"Systems engineer",annualCtcInr:900_000,
    });
    const own=await getTpoDriveOfferRegister(tpo,{jobId:job.id,status:"ALL"});
    expect(own.rows.some(row=>row.id===offer.id)).toBe(true);
    const exported=await getTpoDriveOfferRegisterCsv(tpo,{jobId:job.id,status:"ALL"});
    expect(exported.csv).toContain(offer.id);
    const foreign:RequestContext={...tpo,membership:{
      ...tpo.membership!,id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,
    }};
    for(const query of [
      getTpoDriveOfferRegister(foreign,{jobId:job.id,status:"ALL"}),
      getTpoDriveOfferRegisterCsv(foreign,{jobId:job.id,status:"ALL"}),
    ]){
      await expect(query).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
    }
    const state=await pool.query<{status:string}>(
      "select status from placement_offers where id=$1",[offer.id]);
    expect(state.rows).toEqual([{status:"ISSUED"}]);
  });

  it("TPO-2ND-PAGE-OFFER-EVIDENCE-DB-02 rejects a real offer ID paired with a different drive",async()=>{
    const first=await preparePassedApplication();
    // Same-college job identity is enough to prove the offer/job linkage.
    // Do not seed another application or collide on the fixture company name.
    const secondJob=await createPlacementJob(tpo,{
      ...publishableJobTerms,collegeId:SEED_IDS.collegeA,
      companyRelationshipId:first.company.relationship.id,
      title:"Unrelated offer evidence job",description:"Drive identity isolation",
      employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL",
    });
    const issued=await issuePlacementOffer(tpo,first.application.id,{
      roleTitle:"Offer provenance engineer",annualCtcInr:800_000,
    });
    const correct=await getTpoOfferEvidence(tpo,{jobId:first.job.id,offerId:issued.id});
    expect(correct.offer.id).toBe(issued.id);
    await expect(getTpoOfferEvidence(tpo,{jobId:secondJob.id,offerId:issued.id}))
      .rejects.toMatchObject({code:"PLACEMENT_OFFER_NOT_FOUND"});
    const untouched=await pool.query<{status:string}>(
      "select status from placement_offers where id=$1",[issued.id]);
    expect(untouched.rows).toEqual([{status:"ISSUED"}]);
  });

  it("PLACEMENTS-IDOR-01 refuses a wrong-college TPO, learner issuing an offer and TPO self-acceptance", async () => {
    const { job, application } = await preparePassedApplication();
    const foreignTpo: RequestContext = {
      ...tpo,
      membership: {
        ...tpo.membership!,
        id: SEED_IDS.facultyCollegeBMembership,
        collegeId: SEED_IDS.collegeB,
      },
    };
    await expect(
      issuePlacementOffer(foreignTpo, application.id, {
        roleTitle: "Foreign college must not issue this offer",
        annualCtcInr: 800_000,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      issuePlacementOffer(learner, application.id, {
        roleTitle: "Learners must not issue their own offers",
        annualCtcInr: 800_000,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    const issued = await issuePlacementOffer(tpo, application.id, {
      roleTitle: "Authorized software engineer",
      annualCtcInr: 800_000,
    });
    // Cross-role offer responses mask existence instead of disclosing IDs.
    await expect(
      actOnPlacementOffer(tpo, issued.id, {action: "ACCEPT"}),
    ).rejects.toMatchObject({code:"PLACEMENT_OFFER_NOT_FOUND"});
    await expect(
      recordPlacementJoiningOutcome(learner, issued.id, {
        status: "JOINED", joiningDate: "2099-05-21",
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    // Rejected actions are not partial writes and do not mutate the issuance.
    const rows = await pool.query<{status: string}>(
      "select status from placement_offers where id = $1 and application_id = $2",
      [issued.id,application.id],
    );
    expect(rows.rows).toEqual([{status:"ISSUED"}]);
    expect(job.collegeId).toBe(SEED_IDS.collegeA);
  });

  it("PLACEMENTS-TPO-ESCALATE-21 DB escalates a future round only once, with a real college TPO recipient",async()=>{
    const {job,application,round}=await preparePassedApplication();
    const reference=new Date("2099-10-24T00:00:00.000Z");
    await pool.query(`
      update placement_job_rounds set status='SCHEDULED',scheduled_at=$2,
        timezone='Asia/Kolkata',mode='VIRTUAL',meeting_url='https://meet.example/escalation',completed_at=null
      where id=$1`,[round.id,new Date(reference.getTime()+6*3600_000)]);
    const saved=await pool.query<{id:string}>(`
      insert into placement_learner_requests(
        application_id,learner_membership_id,request_type,round_id,scope_key,reason,requested_by_user_id
      ) values($1,$4,'APPLICATION_WITHDRAWAL',null,$2,
        'Need to withdraw before next interview',$3) returning id`,[
        application.id,"chat5-tpo-escalation:"+application.id,SEED_IDS.learnerUser,
        SEED_IDS.learnerCollegeAMembership,
      ]);
    const requestId=saved.rows[0]!.id;
    const first=await escalatePendingWithdrawalRequests(reference);
    expect(first.errors).toEqual([]);
    expect(first.escalated).toBeGreaterThanOrEqual(1);
    const history=await pool.query<{id:string}>(`
      select id from activity_events where dedupe_key=$1`,
      ["tpo-withdrawal-escalation:"+requestId]);
    expect(history.rows).toHaveLength(1);
    const notice=await pool.query<{user_id:string}>(`
      select user_id from in_app_notifications where event_id=$1`,
      [history.rows[0]!.id]);
    expect(notice.rows.some(row=>row.user_id===SEED_IDS.facultyUser)).toBe(true);
    const second=await escalatePendingWithdrawalRequests(reference);
    expect(second.escalated).toBe(0);
    const after=await pool.query<{count:number}>(`
      select count(*)::int as count from in_app_notifications where event_id=$1`,
      [history.rows[0]!.id]);
    expect(after.rows[0]?.count).toBe(notice.rows.length);
    const request=await pool.query<{status:string}>(`
      select status from placement_learner_requests where id=$1`,[requestId]);
    expect(request.rows).toEqual([{status:"PENDING"}]);
  });

  it("PLACEMENTS-TPO-NOTICE-19 DB preference opt-out suppresses TPO notice without dropping audited decision",async()=>{
    const previous=await pool.query<{notify_application_updates:boolean}>(`
      select notify_application_updates from placement_candidate_preferences
      where membership_id=$1`,[SEED_IDS.learnerCollegeAMembership]);
    await pool.query(`
      insert into placement_candidate_preferences(membership_id,notify_application_updates)
      values($1,false)
      on conflict(membership_id) do update set notify_application_updates=false`,
      [SEED_IDS.learnerCollegeAMembership]);
    try{
      const {job,application}=await preparePassedApplication();
      const offer=await issuePlacementOffer(tpo,application.id,{
        roleTitle:"Opt-out respect engineer",annualCtcInr:900_000,
      });
      const result=await recordTpoOfferLifecycle(tpo,job.id,{
        action:"RECORD_DECLINED",confirmed:true,offerIds:[offer.id],
        expectedStatus:"ISSUED",
        reason:"Employer confirmed the learner declined this offer independently",
      });
      expect(result.updated).toBe(1);
      const recorded=await pool.query<{status:string}>(
        "select status from placement_offers where id=$1",[offer.id]);
      expect(recorded.rows).toEqual([{status:"DECLINED"}]);
      const event=await pool.query<{id:string}>(`
        select id from activity_events where event_type='placements.offer.responded'
        and subject_id=$1`,[offer.id]);
      expect(event.rows).toHaveLength(1);
      const notices=await pool.query<{count:number}>(`
        select count(*)::int as count from in_app_notifications where event_id=$1`,
        [event.rows[0]!.id]);
      expect(notices.rows[0]?.count).toBe(0);
    }finally{
      if(previous.rows.length){
        await pool.query(`
          update placement_candidate_preferences set notify_application_updates=$2
          where membership_id=$1`,[
          SEED_IDS.learnerCollegeAMembership,previous.rows[0]!.notify_application_updates,
        ]);
      }else{
        await pool.query("delete from placement_candidate_preferences where membership_id=$1",
          [SEED_IDS.learnerCollegeAMembership]);
      }
    }
  });

  it("PLACEMENTS-TPO-NOTICE-18 DB issues exactly one preference-scoped learner notice per durable TPO decision",async()=>{
    const {job,application}=await preparePassedApplication();
    const offer=await issuePlacementOffer(tpo,application.id,{
      roleTitle:"Notification parity engineer",annualCtcInr:900_000,
    });
    const before=await pool.query<{count:number}>(`
      select count(*)::int as count from in_app_notifications n
      join activity_events e on e.id=n.event_id
      where e.subject_id=$1 and e.event_type='placements.offer.responded'`,[offer.id]);
    expect(before.rows[0]?.count).toBe(0);
    const accepted=await recordTpoOfferLifecycle(tpo,job.id,{
      confirmed:true,action:"RECORD_ACCEPTED",offerIds:[offer.id],
      expectedStatus:"ISSUED",
      reason:"Written employer confirmation of learner acceptance",
    });
    expect(accepted.updated).toBe(1);
    const notices=await pool.query<{user_id:string;event_id:string}>(`
      select n.user_id,n.event_id from in_app_notifications n
      join activity_events e on e.id=n.event_id
      where e.subject_id=$1 and e.event_type='placements.offer.responded'`,[offer.id]);
    expect(notices.rows).toHaveLength(1);
    expect(notices.rows[0]?.user_id).toBe(SEED_IDS.learnerUser);
    await expect(recordTpoOfferLifecycle(tpo,job.id,{
      confirmed:true,action:"RECORD_ACCEPTED",offerIds:[offer.id],
      expectedStatus:"ISSUED",
      reason:"Repeated employer spreadsheet after accepted status was persisted",
    })).rejects.toMatchObject({code:"PLACEMENT_OFFER_INVALID_TRANSITION"});
    const stable=await pool.query<{count:number}>(`
      select count(*)::int as count from in_app_notifications n
      join activity_events e on e.id=n.event_id
      where e.subject_id=$1 and e.event_type='placements.offer.responded'`,[offer.id]);
    expect(stable.rows[0]?.count).toBe(1);
  });

  it("TPO-JOIN-TRACKER-DB-35 projects only accepted offers and never interprets pending joining as JOINED",async()=>{
    const {job,application}=await preparePassedApplication();
    const offer=await issuePlacementOffer(tpo,application.id,{
      roleTitle:"Joining tracker engineer",annualCtcInr:900_000,
    });
    const before=await getTpoJoiningTracker(tpo,{jobId:job.id});
    expect(before.counts).toEqual({accepted:0,pending:0,joined:0,deferred:0,didNotJoin:0});
    expect(before.items.find(item=>item.offerId===offer.id)).toBeUndefined();
    await recordTpoOfferLifecycle(tpo,job.id,{
      action:"RECORD_ACCEPTED",confirmed:true,offerIds:[offer.id],
      expectedStatus:"ISSUED",reason:"Written confirmation from learner and employer",
    });
    const pending=await getTpoJoiningTracker(tpo,{jobId:job.id});
    expect(pending.counts).toEqual({accepted:1,pending:1,joined:0,deferred:0,didNotJoin:0});
    expect(pending.items[0]).toMatchObject({
      offerId:offer.id,joiningStatus:"PENDING",hasRecordedOutcome:false,joiningDate:null,
    });
    const joiningDay=isoDateInIndia(new Date());
    await expect(recordTpoOfferLifecycle(tpo,job.id,{
      action:"RECORD_JOINED",confirmed:true,offerIds:[offer.id],
      expectedStatus:"ACCEPTED",joiningDate:joiningDay,
      reason:"Offer is still inside the learner dispute window",
    })).rejects.toMatchObject({code:"PLACEMENT_JOINING_NOT_READY"});
    await matureRecordedAcceptance(offer.id);
    await recordTpoOfferLifecycle(tpo,job.id,{
      action:"RECORD_JOINED",confirmed:true,offerIds:[offer.id],
      expectedStatus:"ACCEPTED",joiningDate:joiningDay,
      reason:"Employer confirmed actual physical joining",
    });
    const joined=await getTpoJoiningTracker(tpo,{jobId:job.id});
    expect(joined.counts).toEqual({accepted:1,pending:0,joined:1,deferred:0,didNotJoin:0});
    expect(joined.items[0]).toMatchObject({
      offerId:offer.id,joiningStatus:"JOINED",hasRecordedOutcome:true,joiningDate:joiningDay,
    });
    const other:RequestContext={...tpo,membership:{
      ...tpo.membership!,id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB,
    }};
    await expect(getTpoJoiningTracker(other,{jobId:job.id}))
      .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
  });

  it("PLACEMENTS-JOIN-SM-04 DB refuses future joining evidence without a partial history write",async()=>{
    const {job,application}=await preparePassedApplication();
    const issued=await issuePlacementOffer(tpo,application.id,{
      roleTitle:"Graduate engineer",annualCtcInr:900_000,
    });
    await recordTpoOfferLifecycle(tpo,job.id,{
      action:"RECORD_ACCEPTED",confirmed:true,offerIds:[issued.id],
      expectedStatus:"ISSUED",reason:"Written candidate acceptance received from employer",
    });
    const futureDay=new Date(Date.now()+7*86_400_000).toISOString().slice(0,10);
    await expect(recordTpoOfferLifecycle(tpo,job.id,{
      action:"RECORD_JOINED",confirmed:true,offerIds:[issued.id],
      expectedStatus:"ACCEPTED",joiningDate:futureDay,
      reason:"Employer supplied a future planned joining date, not a completed joining",
    })).rejects.toMatchObject({code:"PLACEMENT_JOINING_NOT_READY"});
    const before=await pool.query<{status:string;joining_date:string|null}>(
      "select status, joining_date::text as joining_date from placement_joining_outcomes where offer_id=$1",
      [issued.id],
    );
    expect(before.rows).toEqual([{status:"PENDING",joining_date:null}]);
    const historyBefore=await pool.query<{count:number}>(
      "select count(*)::int as count from placement_joining_history where offer_id=$1",[issued.id]);
    expect(historyBefore.rows[0]?.count).toBe(0);

    const dayParts=new Intl.DateTimeFormat("en-GB",{
      timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
    }).formatToParts(new Date());
    const fields=Object.fromEntries(dayParts.map(part=>[part.type,part.value]));
    const actualDay=fields.year+"-"+fields.month+"-"+fields.day;
    await matureRecordedAcceptance(issued.id);
    const completed=await recordTpoOfferLifecycle(tpo,job.id,{
      action:"RECORD_JOINED",confirmed:true,offerIds:[issued.id],
      expectedStatus:"ACCEPTED",joiningDate:actualDay,
      reason:"Employer confirmed the learner attended and joined on the recorded date",
    });
    expect(completed.updated).toBe(1);
    const final=await pool.query<{status:string;joining_date:string}>(
      "select status, joining_date::text as joining_date from placement_joining_outcomes where offer_id=$1",
      [issued.id],
    );
    expect(final.rows).toEqual([{status:"JOINED",joining_date:actualDay}]);
    const historyAfter=await pool.query<{count:number}>(
      "select count(*)::int as count from placement_joining_history where offer_id=$1 and to_status='JOINED'",
      [issued.id],
    );
    expect(historyAfter.rows[0]?.count).toBe(1);
  });

  it("PLACEMENTS-SELECTION-IDEMP-DB-01 retries an identical selection without a second audit or timestamp change",async()=>{
    const {job,application}=await preparePassedApplication();
    const request={action:"RECORD" as const,entries:[{
      applicationId:application.id,roleTitle:"Offer engineer",annualCtcInr:900_000,
    }]};
    const first=await recordTpoDriveSelections(tpo,job.id,request);
    expect(first.recorded).toBe(1);
    expect(first.selectionIds).toHaveLength(1);
    const before=await pool.query<{
      recorded_at:string;
    }>("select recorded_at::text from placement_drive_selections where id = $1",[first.selectionIds[0]]);
    expect(before.rowCount).toBe(1);
    const repeated=await recordTpoDriveSelections(tpo,job.id,request);
    expect(repeated).toEqual(first);
    const after=await pool.query<{
      recorded_at:string;
    }>("select recorded_at::text from placement_drive_selections where id = $1",[first.selectionIds[0]]);
    expect(after.rows).toEqual(before.rows);
    const audits=await pool.query<{count:number}>(
      "select count(*)::integer as count from activity_events where event_type = $1 and subject_id = $2",
      ["PLACEMENTS_TPO_SELECTION_RECORDED",job.id],
    );
    expect(audits.rows[0]?.count).toBe(1);

    const foreignTpo:RequestContext={...tpo,membership:{...tpo.membership!,
      id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB}};
    // Tenant-scoped job lookups deliberately conceal foreign job existence.
    await expect(recordTpoDriveSelections(foreignTpo,job.id,request)).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
    await expect(recordTpoDriveSelections(learner,job.id,request)).rejects.toBeInstanceOf(AuthorizationError);
    const stillOne=await pool.query<{count:number}>(
      "select count(*)::integer as count from placement_drive_selections where job_id = $1",[job.id]);
    expect(stillOne.rows[0]?.count).toBe(1);
  });

  it("PLACEMENTS-CLOSE-WAIT-12 DB cannot close between waitlist seat reservation and offer issuance",async()=>{
    const {job,application,round}=await preparePassedApplication();
    await pool.query(`
      insert into placement_waitlist_promotions(
        job_id,round_id,application_id,seat_number,waitlist_rank,reason,promoted_by_user_id
      ) values($1,$2,$3,1,1,'TPO reserved the next available offer seat',$4)`,[
        job.id,round.id,application.id,SEED_IDS.facultyUser,
      ]);
    const preview=await getTpoDriveClosePreview(tpo,job.id);
    expect(preview.pendingSelections).toBe(0);
    expect(preview.pendingPromotions).toBe(1);
    expect(preview.issuedOffers).toBe(0);
    expect(preview.canClose).toBe(false);
    await expect(closeTpoDriveWithPreview(tpo,job.id,{
      action:"CLOSE",confirmed:true,expectedUpdatedAt:preview.expectedUpdatedAt,
      expectedCounts:preview.counts,
      reason:"An unissued waitlist offer must prevent premature closure",
    })).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_CLOSABLE"});
    const stored=await pool.query<{status:string}>(
      "select status from placement_jobs where id=$1",[job.id]);
    expect(stored.rows).toEqual([{status:"PUBLISHED"}]);
  });

  it("PLACEMENTS-WAIT-RACE-06 DB never releases two offers for concurrent identical waitlist previews",async()=>{
    const {job,application,round}=await preparePassedApplication();
    await pool.query(
      "update placement_round_results set outcome='HOLD',waitlist_rank=1,candidate_message='Waitlisted for next available placement seat' where application_id=$1 and round_id=$2",
      [application.id,round.id],
    );
    const preview=await getTpoWaitlistPreview(tpo,job.id);
    expect(preview.next?.applicationId).toBe(application.id);
    const input={action:"OFFER_NEXT" as const,confirmed:true,
      expectedPreviewToken:preview.previewToken,reason:"Company has an opening for the next ranked waitlisted learner",
    };
    const outcomes=await Promise.allSettled([
      offerToNextWaitlisted(tpo,job.id,input),
      offerToNextWaitlisted(tpo,job.id,input),
    ]);
    expect(outcomes.some(result=>result.status==="fulfilled")).toBe(true);
    const promotions=await pool.query<{status:string;offer_id:string|null}>(
      "select status,offer_id from placement_waitlist_promotions where job_id=$1",
      [job.id],
    );
    expect(promotions.rows).toHaveLength(1);
    expect(promotions.rows[0]?.status).toBe("RELEASED");
    expect(promotions.rows[0]?.offer_id).toBeTruthy();
    const offers=await pool.query<{id:string}>(
      `select o.id from placement_offers o
       inner join placement_applications a on a.id=o.application_id
       where a.job_id=$1 and o.kind='OFFER' and o.status in ('ISSUED','ACCEPTED')`,
      [job.id],
    );
    expect(offers.rows).toHaveLength(1);
    expect(offers.rows[0]?.id).toBe(promotions.rows[0]?.offer_id);
    const audit=await pool.query<{summary:string;count:number}>(
      `select summary,count(*)::int as count from activity_events
       where subject_id=$1 and event_type='PLACEMENTS_TPO_WAITLIST_PROMOTED'
       group by summary`,
      [job.id],
    );
    expect(audit.rows.find(row=>row.summary.includes("promoted waitlisted applicant"))?.count).toBe(1);
    // Crash-reconciliation is a distinct durable event and may occur once,
    // but a racing HTTP retry must never duplicate either event category.
    expect(audit.rows.every(row=>row.count===1)).toBe(true);
    expect(audit.rows.length).toBeLessThanOrEqual(2);
    for(const result of outcomes)if(result.status==="fulfilled"){
      expect(result.value.offerId).toBe(offers.rows[0]?.id);
    }
  });

  it("PLACEMENTS-WAIT-SEASON-05 DB denies waitlist promotion and seat creation after season closure",async()=>{
    const {job,application,round}=await preparePassedApplication();
    await pool.query(
      "update placement_round_results set outcome='HOLD',waitlist_rank=1,candidate_message='Waitlisted for next available placement seat' where application_id=$1 and round_id=$2",
      [application.id,round.id],
    );
    const closed=await pool.query<{id:string}>(`
      insert into placement_seasons(
        college_id,name,code,start_date,end_date,status,
        created_by_user_id,closed_by_user_id,closed_at
      ) values($1,$2,$3,'2026-01-01','2026-10-17','CLOSED',$4,$4,now())
      returning id`,[
        SEED_IDS.collegeA,"Closed season for waitlist evidence",
        "chat5-wait-"+job.id.slice(0,8),SEED_IDS.facultyUser,
      ]);
    const seasonId=closed.rows[0]!.id;
    try{
      await pool.query("update placement_jobs set season_id=$1 where id=$2",[seasonId,job.id]);
      const preview=await getTpoWaitlistPreview(tpo,job.id);
      expect(preview.job.seasonStatus).toBe("CLOSED");
      expect(preview.next).toBeNull();
      expect(preview.rows).toHaveLength(1);
      expect(preview.rows[0]?.reasons).toContain("Placement season is not active");
      await expect(offerToNextWaitlisted(tpo,job.id,{
        action:"OFFER_NEXT",confirmed:true,expectedPreviewToken:preview.previewToken,
        reason:"Attempted release after the placement season ended",
      })).rejects.toMatchObject({code:"PLACEMENT_OFFER_NOT_READY"});
      const seats=await pool.query<{count:number}>(
        "select count(*)::int as count from placement_waitlist_promotions where job_id=$1",[job.id]);
      expect(seats.rows[0]?.count).toBe(0);
    }finally{
      await pool.query("update placement_jobs set season_id=$1 where id=$2",[job.seasonId,job.id]);
      await pool.query("delete from placement_seasons where id=$1",[seasonId]);
    }
  });

  it("PLACEMENTS-SELECTION-CAS-06 DB releases a versioned selection with an equivalent IST offset exactly once",async()=>{
    const {job,application}=await preparePassedApplication();
    const selected=await recordTpoDriveSelections(tpo,job.id,{
      action:"RECORD",entries:[{
        applicationId:application.id,roleTitle:"Offer engineer",annualCtcInr:900_000,
      }],
    });
    const selectionId=selected.selectionIds[0]!;
    const saved=await pool.query<{recorded_at:Date}>(
      "select recorded_at from placement_drive_selections where id=$1",[selectionId]);
    expect(saved.rows).toHaveLength(1);
    const instant=saved.rows[0]!.recorded_at;
    const wall=new Date(instant.getTime()+330*60_000);
    const istRevision=wall.toISOString().replace(/Z$/,"+05:30");
    const payload={
      action:"VERIFY_AND_RELEASE" as const,confirmed:true,
      selectionIds:[selectionId],expectedRecordedAt:{[selectionId]:istRevision},
    };
    const first=await verifyAndReleaseTpoSelections(tpo,job.id,payload);
    expect(first).toMatchObject({released:1,skipped:0});
    const retry=await verifyAndReleaseTpoSelections(tpo,job.id,payload);
    expect(retry).toMatchObject({released:1,skipped:0});
    const rows=await pool.query<{status:string;released_offer_id:string}>(
      "select status,released_offer_id from placement_drive_selections where id=$1",[selectionId]);
    expect(rows.rows[0]?.status).toBe("RELEASED");
    expect(rows.rows[0]?.released_offer_id).toBe(first.results[0]?.offerId);
    const events=await pool.query<{event_type:string;count:number}>(
      "select event_type,count(*)::int as count from activity_events where subject_id=$1 and event_type in ('PLACEMENTS_TPO_SELECTION_VERIFIED','PLACEMENTS_TPO_SELECTION_RELEASED') group by event_type",
      [job.id],
    );
    expect(Object.fromEntries(events.rows.map(item=>[item.event_type,item.count])))
      .toEqual({PLACEMENTS_TPO_SELECTION_VERIFIED:1,PLACEMENTS_TPO_SELECTION_RELEASED:1});
  });

  it("PLACEMENTS-SELECTION-RACE-DB-01 concurrent exact selection submits create one row and one audit",async()=>{
    const {job,application}=await preparePassedApplication();
    const request={action:"RECORD" as const,entries:[{
      applicationId:application.id,roleTitle:"Offer engineer",annualCtcInr:900_000,
    }]};
    const settled=await Promise.allSettled([
      recordTpoDriveSelections(tpo,job.id,request),
      recordTpoDriveSelections(tpo,job.id,request),
    ]);
    expect(settled.map(result=>result.status)).toEqual(["fulfilled","fulfilled"]);
    const rows=await pool.query<{id:string}>(
      "select id from placement_drive_selections where job_id = $1",[job.id]);
    expect(rows.rows).toHaveLength(1);
    const audit=await pool.query<{count:number}>(
      "select count(*)::integer as count from activity_events where subject_id = $1 and event_type = $2",
      [job.id,"PLACEMENTS_TPO_SELECTION_RECORDED"]);
    expect(audit.rows[0]?.count).toBe(1);
    for(const outcome of settled)if(outcome.status==="fulfilled"){
      expect(outcome.value.selectionIds).toEqual([rows.rows[0]?.id]);
      expect(outcome.value.recorded).toBe(1);
    }
  });

  it("PLACEMENTS-CLOSE-ENDED-DB-01 closes a published drive after its season ends with complete persisted reconciliation",async()=>{
    const {job,application}=await preparePassedApplication();
    const before=await pool.query<{season_id:string}>(
      "select season_id from placement_jobs where id = $1",[job.id]);
    const originalSeason=before.rows[0]?.season_id;
    expect(originalSeason).toBeTruthy();
    const closedSeason=await pool.query<{id:string}>(`
      insert into placement_seasons (
        college_id,name,code,start_date,end_date,status,
        created_by_user_id,closed_by_user_id,closed_at
      ) values ($1,$2,$3,'2026-01-01','2026-10-17','CLOSED',$4,$4,now())
      returning id`,[
        SEED_IDS.collegeA,"Ended season closeout regression","chat5-closed-"+job.id.slice(0,8),
        SEED_IDS.facultyUser,
      ]);
    const closedSeasonId=closedSeason.rows[0]!.id;
    try {
      await pool.query("update placement_jobs set season_id=$1 where id=$2",[closedSeasonId,job.id]);
      // The same closed season must prevent creating pending company
      // selections that could never be issued as official offers.
      await expect(recordTpoDriveSelections(tpo,job.id,{
        action:"RECORD",entries:[{applicationId:application.id,
          roleTitle:"Engineer",annualCtcInr:900_000}],
      })).rejects.toMatchObject({code:"PLACEMENT_OFFER_NOT_READY"});
      const untouchedSelections=await pool.query<{count:number}>(
        "select count(*)::integer as count from placement_drive_selections where job_id=$1",[job.id]);
      expect(untouchedSelections.rows[0]?.count).toBe(0);
      // Closed season must permit cleanup, never a fresh candidate commitment.
      await expect(issuePlacementOffer(tpo,application.id,{
        kind:"OFFER",roleTitle:"Engineer",annualCtcInr:900_000,
      })).rejects.toMatchObject({code:"PLACEMENT_OFFER_NOT_READY"});
      const noIssue=await pool.query<{count:number}>(
        "select count(*)::integer as count from placement_offers where application_id=$1",[application.id]);
      expect(noIssue.rows[0]?.count).toBe(0);
      const preview=await getTpoDriveClosePreview(tpo,job.id);
      expect(preview).toMatchObject({status:"PUBLISHED",canClose:true,issuedOffers:0,pendingSelections:0});
      const result=await closeTpoDriveWithPreview(tpo,job.id,{
        action:"CLOSE",confirmed:true,expectedUpdatedAt:preview.expectedUpdatedAt,
        expectedCounts:preview.counts,reason:"Final recruitment finished and season already ended",
      });
      expect(result.status).toBe("CLOSED");
      const persisted=await pool.query<{status:string}>(
        "select status from placement_jobs where id=$1",[job.id]);
      expect(persisted.rows[0]?.status).toBe("CLOSED");
      const screening=await pool.query<{status:string}>(
        "select status from placement_application_screenings where application_id=$1",[application.id]);
      expect(screening.rows[0]?.status).toBe("REJECTED");
      const closedAudit=await pool.query<{total:number}>(
        "select count(*)::integer as total from activity_events where subject_id=$1 and event_type=$2",
        [job.id,"PLACEMENTS_TPO_DRIVE_CLOSED_WITH_PREVIEW"]);
      expect(closedAudit.rows[0]?.total).toBe(1);
    } finally {
      await pool.query("update placement_jobs set season_id=$1 where id=$2",[originalSeason,job.id]);
      await pool.query("delete from placement_seasons where id=$1",[closedSeasonId]);
    }
  });

  it("PLACEMENTS-EXPIRY-RACE-DB-04 rejects acceptance delayed past expiry by a competing offer row lock",async()=>{
    const {application}=await preparePassedApplication();
    const issued=await issuePlacementOffer(tpo,application.id,{
      kind:"OFFER",roleTitle:"Offer Engineer",annualCtcInr:900_000,
    });
    const requestTime=new Date();
    const deadline=new Date(requestTime.getTime()+900);
    // Force a narrow expiry window only in the disposable test DB: the
    // public issuance API correctly requires a longer minimum response time.
    await pool.query("update placement_offers set expires_at=$1 where id=$2",[deadline,issued.id]);
    const blocker=await pool.connect();
    await blocker.query("begin");
    try {
      await blocker.query("select id from placement_offers where id=$1 for update",[issued.id]);
      // The explicit requestTime predates expiry. A transaction that obtains
      // the lock later must not be allowed to reuse that earlier timestamp.
      const outcome=actOnPlacementOffer(learner,issued.id,{action:"ACCEPT"},requestTime)
        .then(()=>({accepted:true,code:null}),error=>({
          accepted:false,code:error instanceof Error&&"code" in error?String(error.code):null,
        }));
      await new Promise(resolve=>setTimeout(resolve,1400));
      await blocker.query("commit");
      expect(await outcome).toEqual({accepted:false,code:"PLACEMENT_OFFER_EXPIRED"});
      // The blocker still owns the sole test Pool connection (max: 1).
      // Reuse it after COMMIT; pool.query would deadlock until finally releases it.
      const saved=await blocker.query<{status:string}>(
        "select status from placement_offers where id=$1",[issued.id]);
      expect(saved.rows[0]?.status).toBe("ISSUED");
      const acceptedHistory=await blocker.query<{count:number}>(
        "select count(*)::integer as count from placement_offer_status_history where offer_id=$1 and to_status='ACCEPTED'",
        [issued.id]);
      expect(acceptedHistory.rows[0]?.count).toBe(0);
    } finally {
      await blocker.query("rollback").catch(()=>{});
      blocker.release();
    }
  }, 15000);

  it("PLACEMENTS-CLOSE-PENDING-DB-06 direct close cannot strand a recorded but unreleased company selection",async()=>{
    const {job,application}=await preparePassedApplication();
    const record=await recordTpoDriveSelections(tpo,job.id,{
      action:"RECORD",entries:[{applicationId:application.id,
        roleTitle:"Offer Engineer",annualCtcInr:900_000}],
    });
    expect(record.recorded).toBe(1);
    await expect(closePlacementJob(tpo,job.id)).rejects.toMatchObject({
      code:"PLACEMENT_JOB_NOT_CLOSABLE",
    });
    const jobState=await pool.query<{status:string}>(
      "select status from placement_jobs where id=$1",[job.id]);
    expect(jobState.rows[0]?.status).toBe("PUBLISHED");
    const selection=await pool.query<{status:string}>(
      "select status from placement_drive_selections where id=$1",[record.selectionIds[0]]);
    expect(selection.rows[0]?.status).toBe("SELECTED");
    const closedEvents=await pool.query<{n:number}>(
      "select count(*)::integer as n from activity_events where subject_id=$1 and event_type=$2",
      [job.id,"placements.job.closed"],
    );
    expect(closedEvents.rows[0]?.n).toBe(0);
  });

  it("PLACEMENTS-CAPACITY-PG-01 respects pending waitlist seats without double-counting its own reservation",async()=>{
    const {job,round,application}=await preparePassedApplication();
    await pool.query("update placement_jobs set openings=1 where id=$1",[job.id]);
    const role=await pool.query<{role_option_id:string}>(
      "select role_option_id from placement_applications where id=$1",[application.id]);
    const alternate=await pool.query<{id:string}>(`
      insert into placement_job_role_options(job_id,title,employment_type,work_mode)
      select job_id,title||' second seat',employment_type,work_mode
      from placement_job_role_options where id=$1 returning id`,[role.rows[0]!.role_option_id]);
    const otherApplication=await pool.query<{id:string}>(`
      insert into placement_applications(
        job_id,role_option_id,membership_id,channel,status,
        eligibility_status,eligibility_snapshot,submitted_by_user_id
      ) select job_id,$2,membership_id,channel,status,
          eligibility_status,eligibility_snapshot,submitted_by_user_id
        from placement_applications where id=$1 returning id
    `,[application.id,alternate.rows[0]!.id]);
    const reservation=await pool.query<{id:string}>(`
      insert into placement_waitlist_promotions(
        job_id,round_id,application_id,seat_number,waitlist_rank,
        reason,promoted_by_user_id
      ) values($1,$2,$3,1,1,$4,$5) returning id`,[
        job.id,round.id,otherApplication.rows[0]!.id,
        "Reserved the final waitlisted placement opening",SEED_IDS.facultyUser,
      ]);
    const input={kind:"OFFER" as const,roleTitle:"Offer engineer",annualCtcInr:900_000};
    await expect(issuePlacementOffer(tpo,application.id,input))
      .rejects.toMatchObject({code:"PLACEMENT_OFFER_NOT_READY"});
    const noOffers=await pool.query<{n:number}>(`
      select count(*)::integer as n from placement_offers po
      inner join placement_applications pa on pa.id=po.application_id
      where pa.job_id=$1`,[job.id]);
    expect(noOffers.rows[0]?.n).toBe(0);

    // A valid promotion must consume its own reserved opening once, not twice.
    await pool.query("delete from placement_waitlist_promotions where id=$1",[reservation.rows[0]!.id]);
    await pool.query(`
      insert into placement_waitlist_promotions(
        job_id,round_id,application_id,seat_number,waitlist_rank,
        reason,promoted_by_user_id
      ) values($1,$2,$3,1,1,$4,$5)`,[
        job.id,round.id,application.id,
        "Reserved for the current qualified applicant",SEED_IDS.facultyUser,
      ]);
    const issued=await issuePlacementOffer(tpo,application.id,input);
    expect(issued.status).toBe("ISSUED");
    const retry=await issuePlacementOffer(tpo,application.id,input);
    expect(retry.id).toBe(issued.id);
    const confirmed=await pool.query<{n:number}>(`
      select count(*)::integer as n from placement_offers po
      inner join placement_applications pa on pa.id=po.application_id
      where pa.job_id=$1 and po.status in ('ISSUED','ACCEPTED') and po.kind='OFFER'`,[job.id]);
    expect(confirmed.rows[0]?.n).toBe(1);
  });

  it("PLACEMENTS-ISSUE-ACTOR-DB-02 denies a suspended learner while retaining a legitimately shortlisted application",async()=>{
    const {application}=await preparePassedApplication();
    const terms={kind:"OFFER" as const,roleTitle:"Engineer",annualCtcInr:900_000};
    try {
      await pool.query("update college_memberships set status='SUSPENDED',suspended_at=now() where id=$1",
        [SEED_IDS.learnerCollegeAMembership]);
      await expect(issuePlacementOffer(tpo,application.id,terms))
        .rejects.toMatchObject({code:"PLACEMENT_OFFER_NOT_READY"});
    } finally {
      await pool.query("update college_memberships set status='ACTIVE',suspended_at=null,suspension_reason=null where id=$1",
        [SEED_IDS.learnerCollegeAMembership]);
    }
    try{
      await pool.query("update users set platform_status='DISABLED' where id=$1",[SEED_IDS.learnerUser]);
      await expect(issuePlacementOffer(tpo,application.id,terms))
        .rejects.toMatchObject({code:"PLACEMENT_OFFER_NOT_READY"});
    } finally {
      await pool.query("update users set platform_status='ACTIVE' where id=$1",[SEED_IDS.learnerUser]);
    }
    const before=await pool.query<{n:number}>(
      "select count(*)::integer as n from placement_offers where application_id=$1",[application.id]);
    expect(before.rows[0]?.n).toBe(0);
    const issued=await issuePlacementOffer(tpo,application.id,terms);
    expect(issued.status).toBe("ISSUED");
  });

  it("PLACEMENTS-TPO-REVOKED-DB-01 refuses stale-credential TPO offer mutation after persisted role removal",async()=>{
    const {job,application}=await preparePassedApplication();
    const offer=await issuePlacementOffer(tpo,application.id,{
      kind:"OFFER",roleTitle:"Engineer",annualCtcInr:900_000,
    });
    const request={
      confirmed:true,action:"EXTEND" as const,offerIds:[offer.id],
      expectedStatus:"ISSUED" as const,reason:"Recruiter formally extended the response deadline",
      expiresAt:new Date(Date.now()+1000*60*60*24*7).toISOString(),
    };

    // Revocation must not remove the shared seeded faculty TPO grant used by
    // other concurrent integration files. Give this negative test its own
    // persisted TPO actor, then revoke only that actor's membership role.
    const revokedUserId=randomUUID();
    const revokedMembershipId=randomUUID();
    const revokedRoleId=randomUUID();
    const identityUid="p8-revocation-"+revokedUserId;
    const revokedTpo:RequestContext={
      ...tpo,
      user:{...tpo.user,id:revokedUserId,identityUid},
      membership:{...tpo.membership!,id:revokedMembershipId,roles:["TPO"]},
    };
    await pool.query(
      "insert into users(id,identity_uid) values($1,$2)",
      [revokedUserId,identityUid],
    );
    try{
      await pool.query(
        "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
        [revokedMembershipId,revokedUserId,SEED_IDS.collegeA],
      );
      await pool.query(
        "insert into membership_roles(id,membership_id,role) values($1,$2,'TPO')",
        [revokedRoleId,revokedMembershipId],
      );
      await pool.query("delete from membership_roles where id=$1",[revokedRoleId]);
      await expect(recordTpoOfferLifecycle(revokedTpo,job.id,request))
        .rejects.toBeInstanceOf(AuthorizationError);
      const persisted=await pool.query<{expires_at:Date|null}>(
        "select expires_at from placement_offers where id=$1",[offer.id]);
      expect(persisted.rows[0]?.expires_at?.getTime()).toBe(offer.expiresAt?.getTime());
    }finally{
      await pool.query("delete from membership_roles where membership_id=$1",[revokedMembershipId]);
      await pool.query("delete from college_memberships where id=$1",[revokedMembershipId]);
      await pool.query("delete from users where id=$1",[revokedUserId]);
    }
  });

  it("PLACEMENTS-TPO-CASCADE-17 DB recorded acceptance withdraws ineligible sibling application with correlated history",async()=>{
    const {job,application}=await preparePassedApplication();
    const role=await pool.query<{role_option_id:string}>(
      "select role_option_id from placement_applications where id=$1",[application.id]);
    const siblingRole=await pool.query<{id:string}>(`
      insert into placement_job_role_options(job_id,title,employment_type,work_mode)
      select job_id,title||' sibling',employment_type,work_mode
      from placement_job_role_options where id=$1 returning id`,[role.rows[0]!.role_option_id]);
    const sibling=await pool.query<{id:string}>(`
      insert into placement_applications(
        job_id,role_option_id,membership_id,channel,status,
        eligibility_status,eligibility_snapshot,submitted_by_user_id
      ) select job_id,$2,membership_id,channel,status,
        eligibility_status,eligibility_snapshot,submitted_by_user_id
      from placement_applications where id=$1 returning id`,
      [application.id,siblingRole.rows[0]!.id]);
    const issued=await issuePlacementOffer(tpo,application.id,{
      kind:"OFFER",roleTitle:"Evidence-backed full-time offer",annualCtcInr:900_000,
    });
    const response=await recordTpoOfferLifecycle(tpo,job.id,{
      confirmed:true,action:"RECORD_ACCEPTED",offerIds:[issued.id],
      expectedStatus:"ISSUED",reason:"Employer confirmed this learner accepted the official offer",
    });
    expect(response).toMatchObject({updated:1});
    const acceptedHistory=await pool.query<{reason:string|null;cascade_id:string|null}>(
      `select reason,cascade_id from placement_offer_status_history
       where offer_id=$1 and to_status='ACCEPTED' order by created_at desc limit 1`,[issued.id]);
    expect(acceptedHistory.rows[0]?.cascade_id).toBeNull();
    expect(acceptedHistory.rows[0]?.reason).toContain("48h dispute window");
    await matureRecordedAcceptance(issued.id);
    const matured=await pool.query<{cascade_id:string|null}>(
      "select cascade_id from placement_offers where id=$1",[issued.id]);
    const cascadeId=matured.rows[0]?.cascade_id;
    expect(cascadeId).toMatch(/^[0-9a-f-]{36}$/);
    const siblingState=await pool.query<{status:string}>(
      "select status from placement_applications where id=$1",[sibling.rows[0]!.id]);
    expect(siblingState.rows).toEqual([{status:"WITHDRAWN"}]);
    const siblingHistory=await pool.query<{reason:string|null;cascade_id:string|null}>(
      `select reason,cascade_id from placement_application_status_history
       where application_id=$1 and to_status='WITHDRAWN'`,[sibling.rows[0]!.id]);
    expect(siblingHistory.rows).toEqual([{reason:"placed elsewhere; cascade:"+cascadeId,cascade_id:cascadeId}]);
    const accepted=await pool.query<{status:string}>(
      "select status from placement_offers where id=$1",[issued.id]);
    expect(accepted.rows).toEqual([{status:"ACCEPTED"}]);
    const audit=await pool.query<{metadata:Record<string,unknown>}>(
      "select metadata from activity_events where dedupe_key=$1",
      ["placement-external-acceptance-finalized:"+issued.id]);
    // The TPO's record and the scheduler's finalization are distinct
    // audited actions; the scheduler owns the cascade after the 48h window.
    expect(audit.rows[0]?.metadata).toMatchObject({
      action:"EXTERNAL_ACCEPTANCE_FINALIZED",
      cascadeId,originalRecorderUserId:SEED_IDS.facultyUser,
    });
  });

  it("PLACEMENTS-TPO-DUAL-ACCEPT-DB-01 rolls back a batch that accepts two official offers for one learner",async()=>{
    const {job,application}=await preparePassedApplication();
    const issued=await issuePlacementOffer(tpo,application.id,{
      kind:"OFFER",roleTitle:"Engineer I",annualCtcInr:900_000,
    });
    const role=await pool.query<{role_option_id:string}>(
      "select role_option_id from placement_applications where id=$1",[application.id]);
    const secondRole=await pool.query<{id:string}>(`
      insert into placement_job_role_options(job_id,title,employment_type,work_mode)
      select job_id,title||' second',employment_type,work_mode
      from placement_job_role_options where id=$1 returning id`,[role.rows[0]!.role_option_id]);
    const secondApp=await pool.query<{id:string}>(`
      insert into placement_applications(
        job_id,role_option_id,membership_id,channel,status,
        eligibility_status,eligibility_snapshot,submitted_by_user_id
      ) select job_id,$2,membership_id,channel,status,
          eligibility_status,eligibility_snapshot,submitted_by_user_id
        from placement_applications where id=$1 returning id
    `,[application.id,secondRole.rows[0]!.id]);
    const secondOffer=await pool.query<{id:string}>(`
      insert into placement_offers(application_id,version,kind,status,role_title,annual_ctc_inr,issued_by_user_id)
      values($1,1,'OFFER','ISSUED','Engineer II',900000,$2) returning id
    `,[secondApp.rows[0]!.id,SEED_IDS.facultyUser]);
    const ids=[issued.id,secondOffer.rows[0]!.id];
    await expect(recordTpoOfferLifecycle(tpo,job.id,{
      confirmed:true,action:"RECORD_ACCEPTED",offerIds:ids,
      expectedStatus:"ISSUED",reason:"Both candidate responses were reported on the company spreadsheet",
    })).rejects.toMatchObject({code:"PLACEMENT_OFFER_ACTIVE_EXISTS"});
    const state=await pool.query<{id:string;status:string}>(
      "select id,status from placement_offers where id=any($1::uuid[]) order by id",[ids]);
    expect(state.rows).toHaveLength(2);
    expect(state.rows.every(row=>row.status==="ISSUED")).toBe(true);
    const history=await pool.query<{count:number}>(
      "select count(*)::integer as count from placement_offer_status_history where offer_id=any($1::uuid[]) and to_status='ACCEPTED'",
      [ids]);
    expect(history.rows[0]?.count).toBe(0);
  });

  it("PLACEMENTS-SELECTION-RECONCILE-DB-03 never treats an issued LOI as a released official OFFER",async()=>{
    const {job,application}=await preparePassedApplication();
    const entry={applicationId:application.id,roleTitle:"Engineer",annualCtcInr:900_000};
    const selected=await recordTpoDriveSelections(tpo,job.id,{action:"RECORD",entries:[entry]});
    const selectionId=selected.selectionIds[0]!;
    await pool.query(`
      update placement_drive_selections
      set status='VERIFIED',verified_by_user_id=$1,verified_at=now(),updated_at=now()
      where id=$2`,[SEED_IDS.facultyUser,selectionId]);
    const saved=await pool.query<{recorded_at:Date}>(
      "select recorded_at from placement_drive_selections where id=$1",[selectionId]);
    const letter=await issuePlacementOffer(tpo,application.id,{
      kind:"LOI",roleTitle:entry.roleTitle,annualCtcInr:entry.annualCtcInr,
    });
    expect(letter.kind).toBe("LOI");
    const attempt=await verifyAndReleaseTpoSelections(tpo,job.id,{
      action:"VERIFY_AND_RELEASE",confirmed:true,selectionIds:[selectionId],
      expectedRecordedAt:{[selectionId]:saved.rows[0]!.recorded_at.toISOString()},
    });
    expect(attempt.released).toBe(0);
    expect(attempt.skipped).toBe(1);
    const after=await pool.query<{status:string;released_offer_id:string|null}>(
      "select status,released_offer_id from placement_drive_selections where id=$1",[selectionId]);
    expect(after.rows).toEqual([{status:"VERIFIED",released_offer_id:null}]);
    const releasedAudit=await pool.query<{n:number}>(
      "select count(*)::integer as n from activity_events where subject_id=$1 and event_type=$2",
      [job.id,"PLACEMENTS_TPO_SELECTION_RELEASED"]);
    expect(releasedAudit.rows[0]?.n).toBe(0);
  });

  it("issues an idempotent offer, lets the learner accept, and preserves corrected joining history", async () => {
    const { application } =
      await preparePassedApplication();

    const issued =
      await issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Software Engineer",
          annualCtcInr: 1_200_000,
          joiningDate: "2027-01-10",
          expiresAt: new Date(
            "2099-11-01T18:29:59.000Z",
          ),
        },
      );

    expect(issued).toMatchObject({
      version: 1,
      status: "ISSUED",
      roleTitle: "Software Engineer",
      annualCtcInr: 1_200_000,
      joiningDate: "2027-01-10",
    });

    const repeated =
      await issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Software Engineer",
          annualCtcInr: 1_200_000,
          joiningDate: "2027-01-10",
          expiresAt: new Date(
            "2099-11-01T18:29:59.000Z",
          ),
        },
      );
    expect(repeated.id).toBe(issued.id);

    const issuedEvents =
      await pool.query<{ id: string }>(
        "select id from activity_events where dedupe_key = $1",
        [
          `placement-offer:${issued.id}:issued`,
        ],
      );
    expect(issuedEvents.rowCount).toBe(1);

    const notifications =
      await pool.query<{ id: string }>(
        `select n.id
           from in_app_notifications n
           inner join activity_events e
             on e.id = n.event_id
          where n.user_id = $1
            and e.dedupe_key = $2`,
        [
          SEED_IDS.learnerUser,
          `placement-offer:${issued.id}:issued`,
        ],
      );
    expect(notifications.rowCount).toBe(1);

    await expect(
      issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Senior Software Engineer",
          annualCtcInr: 1_400_000,
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_OFFER_ACTIVE_EXISTS",
    });

    const accepted =
      await actOnPlacementOffer(
        learner,
        issued.id,
        { action: "ACCEPT" },
      );
    expect(accepted.status).toBe(
      "ACCEPTED",
    );
    // PLACEMENTS-OFFER-RETRY-05: the same durable response can be replayed
    // long after the response window closed; do not double-notify or cascade.
    const historyBeforeExpiredRetry=await pool.query<{n:number}>(
      "select count(*)::integer as n from placement_offer_status_history where offer_id=$1",
      [issued.id],
    );
    const replay=await actOnPlacementOffer(
      learner,issued.id,{action:"ACCEPT"},new Date("2099-11-01T18:30:00Z"),
    );
    expect(replay.status).toBe("ACCEPTED");
    if (!("cascadeId" in replay) || !("cascadeId" in accepted)) {
      throw new Error("A replayed acceptance must preserve its durable cascade ID");
    }
    expect(replay.cascadeId).toBe(accepted.cascadeId);
    const historyAfterExpiredRetry=await pool.query<{n:number}>(
      "select count(*)::integer as n from placement_offer_status_history where offer_id=$1",
      [issued.id],
    );
    expect(historyAfterExpiredRetry.rows).toEqual(historyBeforeExpiredRetry.rows);
    await expect(actOnPlacementOffer(
      learner,issued.id,{action:"DECLINE"},new Date("2099-11-01T18:30:00Z"),
    )).rejects.toMatchObject({code:"PLACEMENT_OFFER_EXPIRED"});


    const offers =
      await listOwnPlacementOffers(
        learner,
      );
    expect(offers[0]).toMatchObject({
      offer: {
        id: issued.id,
        status: "ACCEPTED",
      },
      joining: {
        status: "PENDING",
      },
    });

    const deferred =
      await recordPlacementJoiningOutcome(
        tpo,
        issued.id,
        {
          status: "DEFERRED",
          joiningDate: "2027-02-01",
          reason:
            "University completion date moved",
        },
      );
    expect(deferred).toMatchObject({
      status: "DEFERRED",
      joiningDate: "2027-02-01",
    });

    await expect(
      recordPlacementJoiningOutcome(
        tpo,
        issued.id,
        {
          status: "JOINED",
          joiningDate: "2027-02-03",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_JOINING_CORRECTION_REASON_REQUIRED",
    });

    const joined =
      await recordPlacementJoiningOutcome(
        tpo,
        issued.id,
        {
          status: "JOINED",
          joiningDate: "2027-02-03",
          correctionReason:
            "Confirmed actual joining date",
        },
      );
    expect(joined).toMatchObject({
      status: "JOINED",
      joiningDate: "2027-02-03",
    });

    // PLACEMENTS-JOINING-01: same payload is a safe retry after a lost HTTP
    // response, not an implicit correction, second history row or notification.
    const historyBeforeRetry = await pool.query<{ total: number }>(
      "select count(*)::integer as total from placement_joining_history where offer_id = $1",
      [issued.id],
    );
    const repeatedJoining = await recordPlacementJoiningOutcome(tpo, issued.id, {
      status: "JOINED",
      joiningDate: "2027-02-03",
    });
    expect(repeatedJoining.offerId).toBe(joined.offerId);
    const historyAfterRetry = await pool.query<{ total: number }>(
      "select count(*)::integer as total from placement_joining_history where offer_id = $1",
      [issued.id],
    );
    expect(historyAfterRetry.rows[0]?.total).toBe(historyBeforeRetry.rows[0]?.total);

    const lifecycleEvents =
      await pool.query<{
        event_type: string;
      }>(
        `select event_type
           from activity_events
          where subject_id = $1
          order by occurred_at asc`,
        [issued.id],
      );
    expect(
      lifecycleEvents.rows.map(
        (row) => row.event_type,
      ),
    ).toEqual(
      expect.arrayContaining([
        "placements.offer.issued",
        "placements.offer.responded",
        "placements.joining.recorded",
      ]),
    );

    await expect(
      actOnPlacementOffer(
        tpo,
        issued.id,
        {
          action: "WITHDRAW",
          reason:
            "Attempted post-joining withdrawal",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_OFFER_INVALID_TRANSITION",
    });
  });

  it("keeps declined offers durable and allows a later version", async () => {
    const { application } =
      await preparePassedApplication();

    const first =
      await issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Graduate Engineer",
          annualCtcInr: 900_000,
        },
      );

    const declined =
      await actOnPlacementOffer(
        learner,
        first.id,
        {
          action: "DECLINE",
          reason:
            "Pursuing higher studies",
        },
      );
    expect(declined.status).toBe(
      "DECLINED",
    );
    const beforeDeclinedReplay=await pool.query<{n:number}>(
      "select count(*)::integer as n from placement_offer_status_history where offer_id=$1",
      [first.id],
    );
    const sameDecline=await actOnPlacementOffer(
      learner,first.id,{action:"DECLINE"},new Date("2099-10-18T18:30:00Z"),
    );
    expect(sameDecline.status).toBe("DECLINED");
    const afterDeclinedReplay=await pool.query<{n:number}>(
      "select count(*)::integer as n from placement_offer_status_history where offer_id=$1",
      [first.id],
    );
    expect(afterDeclinedReplay.rows).toEqual(beforeDeclinedReplay.rows);


    const second =
      await issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle:
            "Graduate Engineer",
          annualCtcInr: 1_000_000,
        },
      );

    expect(second.version).toBe(2);
    expect(second.id).not.toBe(
      first.id,
    );
  });

  it("blocks offers before final applied pass and expired learner acceptance", async () => {
    const company =
      await createPlacementCompany(tpo, {
        collegeId: SEED_IDS.collegeA,
        name: "Early Offer Systems",
        primaryDomain:
          "early-offer.example",
      });
    const job =
      await createPlacementJob(tpo, {
    ...publishableJobTerms,
        collegeId: SEED_IDS.collegeA,
        companyRelationshipId:
          company.relationship.id,
        title: "Early Offer Engineer",
        description:
          "Offer readiness fixture",
        employmentType: "FULL_TIME",
        workMode: "REMOTE",
        applicationMode: "INTERNAL",
      });
    await createPlacementRound(
      tpo,
      job.id,
      {
        kind: "INTERVIEW",
        name: "Interview",
      },
    );
    await publishPreparedPlacementJob(
      tpo,
      job.id,
    );
    const application =
      await applyToPlacementJob(
        learner,
        job.id,
        {},
      );
    await decidePlacementScreening(
      tpo,
      application.id,
      {
        decision: "SHORTLISTED",
        candidateMessage:
          "Shortlisted",
      },
    );

    await expect(
      issuePlacementOffer(
        tpo,
        application.id,
        {
          roleTitle: "Engineer",
        },
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_OFFER_NOT_READY",
    });

    const passed =
      await preparePassedApplication();
    const expired =
      await issuePlacementOffer(
        tpo,
        passed.application.id,
        {
          roleTitle: "Engineer",
          expiresAt: new Date(
            "2099-11-01T00:00:00.000Z",
          ),
        },
      );

    await expect(
      actOnPlacementOffer(
        learner,
        expired.id,
        { action: "ACCEPT" },
        new Date(
          "2099-11-02T00:00:00.000Z",
        ),
      ),
    ).rejects.toMatchObject({
      code:
        "PLACEMENT_OFFER_EXPIRED",
    });
  });
  it("never issues an offer after screening is revoked or a previously applied round no longer passes", async () => {
    const { application } = await preparePassedApplication();

    await pool.query(
      "update placement_application_screenings set status = 'REJECTED' where application_id = $1",
      [application.id],
    );
    await expect(issuePlacementOffer(tpo, application.id, {
      roleTitle: "Offer must not escape withdrawn screening",
    })).rejects.toMatchObject({ code: "PLACEMENT_OFFER_NOT_READY" });

    await pool.query(
      "update placement_application_screenings set status = 'SHORTLISTED' where application_id = $1",
      [application.id],
    );
    await pool.query(
      // A rejected result must satisfy the persisted candidate-message
      // contract. Otherwise this fixture fails its CHECK before offer
      // eligibility is exercised.
      "update placement_round_results set outcome = 'FAIL', candidate_message = 'Did not meet the required round threshold' where application_id = $1 and status = 'APPLIED'",
      [application.id],
    );
    await expect(issuePlacementOffer(tpo, application.id, {
      roleTitle: "Offer must not escape failed interview",
    })).rejects.toMatchObject({ code: "PLACEMENT_OFFER_NOT_READY" });

    const count = await pool.query<{ total: string }>(
      "select count(*)::text as total from placement_offers where application_id = $1",
      [application.id],
    );
    expect(count.rows[0]?.total).toBe("0");
  });

});
