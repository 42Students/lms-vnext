import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {placementRecruiterPublicContacts} from "@/db/schema/placement-recruiter-public-contacts";
import {placementTableExists} from "./staged-tables";
import {
  placementCompanies,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  activityEvents, inAppNotifications, collegeMemberships, membershipRoles, colleges,
  users,
} from "@/db/schema";
import { hasActiveRecruiter, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { placementRecruiterGrantIdSchema } from "./validation";

export function ownRecruiterGrant(
  context: RequestContext,
  grantId: string,
) {
  if (!hasActiveRecruiter(context) || !context.recruiter || context.recruiter.userId !== context.user.id) {
    throw new AuthorizationError("placements.recruiter.read");
  }
  const grant = context.recruiter.grants.find((item) => item.id === grantId);
  if (!grant) throw new AuthorizationError("placements.recruiter.read");
  return grant;
}

export async function getRecruiterSelfProfile(context: RequestContext, selectedCollegeId?: string) {
  if (!hasActiveRecruiter(context) || !context.recruiter || context.recruiter.userId !== context.user.id) {
    throw new AuthorizationError("placements.recruiter.read");
  }
  const [row] = await getDb()
    .select({
      userId: users.id,
      displayName: users.displayName,
      userUpdatedAt: users.updatedAt,
      email: users.email,
      phoneE164: users.phoneE164,
      title: placementRecruiterProfiles.title,
      profileUpdatedAt: placementRecruiterProfiles.updatedAt,
      companyId: placementCompanies.id,
      companyName: placementCompanies.name,
    })
    .from(users)
    .innerJoin(
      placementRecruiterProfiles,
      eq(placementRecruiterProfiles.userId, users.id),
    )
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementRecruiterProfiles.companyId),
    )
    .where(and(
      eq(users.id, context.user.id),
      eq(users.platformStatus, "ACTIVE"),
      eq(placementRecruiterProfiles.status, "ACTIVE"),
      eq(placementCompanies.status, "ACTIVE"),
    ))
    .limit(1);
  if (!row) throw new AuthorizationError("placements.recruiter.read");
  const contactReady=await placementTableExists("placement_recruiter_public_contacts");
  const [contact]=contactReady?await getDb().select({phone:placementRecruiterPublicContacts.phoneDigits})
   .from(placementRecruiterPublicContacts).where(
    eq(placementRecruiterPublicContacts.recruiterUserId,context.user.id)).limit(1):[];
  return { ...row, contactPhoneDigits:contact?.phone??null,contactReady,
   // A caller selecting a college must not receive unrelated college grants.
   grants: selectedCollegeId ? context.recruiter.grants.filter(grant=>grant.collegeId===selectedCollegeId) : context.recruiter.grants };
}

export async function leaveOwnRecruiterCollegeAccess(
  context: RequestContext,
  rawGrantId: string,
  now = new Date(),
) {
  const grantId = placementRecruiterGrantIdSchema.parse(rawGrantId);
  const grant = ownRecruiterGrant(context, grantId);
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new AuthorizationError("placements.recruiter.read");
  }

  return getDb().transaction(async tx=>{
    const [revoked] = await tx
      .update(placementRecruiterCollegeGrants)
      .set({
        status: "REVOKED",
        revokedByUserId: context.user.id,
        revokedAt: now,
        updatedAt: now,
      })
      .where(and(
        eq(placementRecruiterCollegeGrants.id, grantId),
        eq(placementRecruiterCollegeGrants.recruiterUserId, context.user.id),
        eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
        eq(placementRecruiterCollegeGrants.companyRelationshipId, grant.companyRelationshipId),
      ))
      .returning({ id: placementRecruiterCollegeGrants.id });
    if (!revoked) throw new AuthorizationError("placements.recruiter.read");

    const [college] = await tx.select({organizationId:colleges.organizationId})
      .from(colleges).where(and(eq(colleges.id,grant.collegeId),eq(colleges.status,"ACTIVE"))).limit(1);
    if(college){
      const [event]=await tx.insert(activityEvents).values({
        organizationId:college.organizationId,collegeId:grant.collegeId,
        actorUserId:context.user.id,module:"PLACEMENTS",
        eventType:"placements.recruiter.access.left",
        subjectType:"placement_recruiter_college_grant",subjectId:revoked.id,
        summary:"Recruiter left college access",occurredAt:now,
        metadata:{grantId:revoked.id},
      }).returning({id:activityEvents.id});
      const recipients=await tx.selectDistinct({userId:collegeMemberships.userId})
        .from(collegeMemberships)
        .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
        .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
        .where(and(eq(collegeMemberships.collegeId,grant.collegeId),eq(collegeMemberships.status,"ACTIVE")));
      if(event&&recipients.length)await tx.insert(inAppNotifications).values(recipients.map(recipient=>({
        userId:recipient.userId,eventId:event.id,title:"Recruiter left college access",
        body:"A recruiter has left this college. Review active recruiter grants and access.",
        actionHref:"/tpo/settings/recruiters",createdAt:now,
      }))).onConflictDoNothing();
    }
    return { grantId: revoked.id, status: "REVOKED" as const };
  });
}
