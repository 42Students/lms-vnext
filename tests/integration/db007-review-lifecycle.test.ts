import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { getDb, closeDatabaseConnection } from "@/db/client";
import { and, eq } from "drizzle-orm";
import { profileVerificationEvents, profileVerifications } from "@/db/schema/profile-verification";
import type { RequestContext } from "@/modules/identity/context";
import { createProfileVerificationRepository } from "@/modules/profile-verification/repository";
import {
  reviewProfileVerification, submitOwnVerification,
  withdrawOwnPendingVerification,
} from "@/modules/profile-verification/service";
import type { VerificationTransactionRepository } from "@/modules/profile-verification/service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

// These committed event records are intentionally immutable. Only run in an
// isolated disposable database destroyed with the PG job; no production or
// shared DB and no trigger-disabling teardown.
const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1" &&
  process.env.DB04_REGISTERED_PG === "YES";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL }) : null;
afterAll(async () => { await pool?.end(); if(enabled)await closeDatabaseConnection(); });

const admin: RequestContext = {
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"db007-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
async function createLearner(collegeId=SEED_IDS.collegeA) {
  if (!pool) throw Error("Disposable PostgreSQL required");
  const userId=randomUUID(),membershipId=randomUUID(),roleId=randomUUID();
  await pool.query(
    "INSERT INTO users(id,identity_uid,display_name) VALUES($1,$2,$3)",
    [userId,"db007-review-"+userId,"DB007 review test learner"],
  );
  await pool.query(
    "INSERT INTO college_memberships(id,user_id,college_id) VALUES($1,$2,$3)",
    [membershipId,userId,collegeId],
  );
  await pool.query(
    "INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
    [roleId,membershipId],
  );
  const context:RequestContext = {
    user:{id:userId,identityUid:"db007-review-"+userId,platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:membershipId,collegeId,
      organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
  };
  return {userId,membershipId,context};
}
function stubEvidence(): {
  repository:VerificationTransactionRepository;
  changeSnapshot:(value:string)=>void;
} {
  let masked="XXXXXXXX1111";
  const base=createProfileVerificationRepository();
  return {
    repository:{
      ...base,
      // Simulate a trusted object verifier only for the *transition state*
      // witness. This is NOT proof of actual private storage scanning.
      readCurrentSectionForSubmission:async()=>({
        snapshot:{panNumber:masked},documentsReady:true,
      }),
      submittedEvidenceIsValid:async()=>true,
    },
    changeSnapshot:value=>{masked=value;},
  };
}
describe.skipIf(!enabled)("DB-007 registered verification writer lifecycle and concurrent reviews",()=>{
  it("persists immutable submission, send-back, verified snapshot and safe pending revision",async()=>{
    const learner=await createLearner(),{repository,changeSnapshot}=stubEvidence();
    const first=await submitOwnVerification(learner.context,"IDENTITY",0,repository);
    expect([first.status,first.version]).toEqual(["SUBMITTED",1]);
    const rejected=await reviewProfileVerification(admin,{
      learnerMembershipId:learner.membershipId,section:"IDENTITY",expectedVersion:1,
      action:"SEND_BACK",reason:"Please upload a legible document",
    },repository);
    expect([rejected.status,rejected.version]).toEqual(["SENT_BACK",2]);
    changeSnapshot("XXXXXXXX2222");
    const submitted=await submitOwnVerification(learner.context,"IDENTITY",2,repository);
    expect([submitted.status,submitted.version]).toEqual(["SUBMITTED",3]);
    const approved=await reviewProfileVerification(admin,{
      learnerMembershipId:learner.membershipId,section:"IDENTITY",expectedVersion:3,
      action:"VERIFY",
    },repository);
    expect([approved.status,approved.version]).toEqual(["VERIFIED",4]);
    changeSnapshot("XXXXXXXX3333");
    const pending=await submitOwnVerification(learner.context,"IDENTITY",4,repository);
    expect([pending.status,pending.version]).toEqual(["UPDATE_PENDING",5]);
    expect(pending.verifiedSnapshot).toEqual(approved.verifiedSnapshot);
    const withdrawn=await withdrawOwnPendingVerification(learner.context,"IDENTITY",5,repository);
    expect([withdrawn.status,withdrawn.version]).toEqual(["VERIFIED",6]);
    expect(withdrawn.verifiedSnapshot).toEqual(approved.verifiedSnapshot);
    const records=await getDb().select().from(profileVerifications)
      .where(and(eq(profileVerifications.learnerMembershipId,learner.membershipId),
        eq(profileVerifications.section,"IDENTITY")));
    expect(records).toHaveLength(1);
    const history=await getDb().select().from(profileVerificationEvents)
      .where(eq(profileVerificationEvents.verificationId,records[0]!.id));
    expect(history.map(x=>x.action).sort()).toEqual(
      ["SUBMITTED","SENT_BACK","SUBMITTED","VERIFIED","UPDATE_SUBMITTED","WITHDRAWN"].sort(),
    );
    await expect(reviewProfileVerification(admin,{
      learnerMembershipId:learner.membershipId,section:"IDENTITY",expectedVersion:5,
      action:"VERIFY",
    },repository)).rejects.toMatchObject({code:"STALE_VERSION"});
  });
  it("serializes two reviewers for same submission and denies a different college",async()=>{
    const learner=await createLearner(),{repository}=stubEvidence();
    await submitOwnVerification(learner.context,"IDENTITY",0,repository);
    const wrongAdmin:RequestContext={...admin,membership:{
      ...admin.membership!,collegeId:SEED_IDS.collegeB,
    }};
    await expect(reviewProfileVerification(wrongAdmin,{
      learnerMembershipId:learner.membershipId,section:"IDENTITY",
      expectedVersion:1,action:"SEND_BACK",reason:"Cross-college reviewer",
    },repository)).rejects.toMatchObject({name:"AuthorizationError"});
    const request={
      learnerMembershipId:learner.membershipId,section:"IDENTITY" as const,
      expectedVersion:1,action:"SEND_BACK" as const,reason:"A legible image is required",
    };
    const outcomes=await Promise.allSettled([
      reviewProfileVerification(admin,request,repository),
      reviewProfileVerification(admin,request,repository),
    ]);
    expect(outcomes.filter(x=>x.status==="fulfilled")).toHaveLength(1);
    const rejected=outcomes.find(x=>x.status==="rejected");
    expect(rejected?.status==="rejected" ? rejected.reason : null)
      .toMatchObject({code:"STALE_VERSION"});
  });
});
