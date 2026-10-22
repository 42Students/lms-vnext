import { randomUUID } from "node:crypto";
import { getDb } from "@/db/client";
import {
  placementRecruiterCollegeGrants,
  placementRecruiterDriveRequests,
  placementRecruiterProfiles,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";

/**
 * HR-GRANT-EXPIRE-39 + recruiter job ownership: recruiter reads join the
 * persisted user, ACTIVE profile and ACTIVE/VERIFIED/unexpired DRIVES grant,
 * and only show jobs the recruiter created or that came from their own
 * approved drive request. A synthetic session context alone never
 * authorizes. Persist that state for one recruiter and one existing job.
 */
export async function createPersistedJobRecruiter(input: {
  companyId: string;
  companyRelationshipId: string;
  collegeId: string;
  jobId: string;
  grantedByUserId: string;
  identityUid: string;
}): Promise<{ userId: string; grantId: string }> {
  const db = getDb();
  const [user] = await db.insert(users).values({
    identityUid: input.identityUid,
    displayName: "Fixture Recruiter",
  }).returning({ id: users.id });
  if (!user) throw new Error("Recruiter fixture user was not created");
  await db.insert(placementRecruiterProfiles).values({
    userId: user.id,
    companyId: input.companyId,
    createdByUserId: input.grantedByUserId,
  });
  const [grant] = await db.insert(placementRecruiterCollegeGrants).values({
    recruiterUserId: user.id,
    companyRelationshipId: input.companyRelationshipId,
    grantedByUserId: input.grantedByUserId,
    status: "ACTIVE",
    verificationStatus: "VERIFIED",
    validUntil: new Date("2099-01-01T00:00:00.000Z"),
    capabilities: ["DRIVES"],
  }).returning({ id: placementRecruiterCollegeGrants.id });
  if (!grant) throw new Error("Recruiter fixture grant was not created");
  await linkRecruiterOwnedJob({
    recruiterUserId: user.id,
    collegeId: input.collegeId,
    companyRelationshipId: input.companyRelationshipId,
    jobId: input.jobId,
    decidedByUserId: input.grantedByUserId,
  });
  return { userId: user.id, grantId: grant.id };
}

/**
 * Recruiter job ownership: a TPO-created job becomes the recruiter's own
 * drive only through the recruiter's approved drive request (approved_job_id).
 */
export async function linkRecruiterOwnedJob(input: {
  recruiterUserId: string;
  collegeId: string;
  companyRelationshipId: string;
  jobId: string;
  decidedByUserId: string;
}): Promise<void> {
  await getDb().insert(placementRecruiterDriveRequests).values({
    collegeId: input.collegeId,
    companyRelationshipId: input.companyRelationshipId,
    recruiterUserId: input.recruiterUserId,
    submissionId: randomUUID(),
    approvedJobId: input.jobId,
    status: "DRAFT",
    draft: { title: "Fixture drive request" },
    decidedByUserId: input.decidedByUserId,
    decidedAt: new Date(),
  });
}

/** Session context matching a persisted recruiter (or a deliberately wrong company). */
export function persistedRecruiterContext(input: {
  userId: string;
  identityUid: string;
  companyId: string;
  grantId: string;
  collegeId: string;
  organizationId: string;
  companyRelationshipId: string;
}): RequestContext {
  return {
    user: {
      id: input.userId,
      identityUid: input.identityUid,
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: null,
    recruiter: {
      userId: input.userId,
      companyId: input.companyId,
      companyName: "Fixture",
      status: "ACTIVE",
      title: null,
      grants: [{
        id: input.grantId,
        collegeId: input.collegeId,
        organizationId: input.organizationId,
        collegeName: "Fixture",
        companyRelationshipId: input.companyRelationshipId,
      }],
    },
  };
}
