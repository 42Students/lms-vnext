import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import {profileVerifications,profileVerificationEvents} from "@/db/schema/profile-verification";
import type {RequestContext} from "@/modules/identity/context";
import {VerificationStateError,type VerificationSection,type VerificationStatus} from "@/modules/profile-verification/domain";
import {verificationDocumentManifest} from "./document-manifest";
import {requireCollegeVerificationActor,requireVerificationTables} from "./staff-auth";
import {requireSuperAdminVerificationCollege} from "./super-admin-scope";
import {requireTpoVerificationActor} from "./tpo-staff-auth";

export async function getCollegeVerificationDetail(context:RequestContext,membershipId:string,section:VerificationSection,superAdminCollegeId?:string,allowTpo=false){
 const scope=superAdminCollegeId ? await requireSuperAdminVerificationCollege(context,superAdminCollegeId) : allowTpo ? await requireTpoVerificationActor(context) : await requireCollegeVerificationActor(context);
 await requireVerificationTables();
 const [record]=await getDb().select({
  verificationId:profileVerifications.id,
  learnerMembershipId:collegeMemberships.id,learnerName:users.displayName,
  section:profileVerifications.section,status:profileVerifications.status,
  version:profileVerifications.rowVersion,submittedAt:profileVerifications.submittedAt,
  verifiedAt:profileVerifications.verifiedAt,decidedAt:profileVerifications.decidedAt,
  note:profileVerifications.note,submittedSnapshot:profileVerifications.submittedSnapshot,
  verifiedSnapshot:profileVerifications.verifiedSnapshot,
 }).from(profileVerifications)
 .innerJoin(collegeMemberships,eq(collegeMemberships.id,profileVerifications.learnerMembershipId))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
 .where(and(eq(collegeMemberships.collegeId,scope.collegeId),eq(collegeMemberships.status,"ACTIVE"),
  eq(users.platformStatus,"ACTIVE"),eq(profileVerifications.learnerMembershipId,membershipId),
  eq(profileVerifications.section,section))).limit(1);
 if(!record)throw new VerificationStateError("NOT_ALLOWED");
 const events=await getDb().select({
   id:profileVerificationEvents.id,action:profileVerificationEvents.action,
   actorKind:profileVerificationEvents.actorKind,
   actorName:profileVerificationEvents.actorName,
   note:profileVerificationEvents.note,
   occurredAt:profileVerificationEvents.createdAt,
   priorVersion:profileVerificationEvents.priorVersion,
   nextVersion:profileVerificationEvents.nextVersion,
 }).from(profileVerificationEvents)
   .where(eq(profileVerificationEvents.verificationId,record.verificationId))
   .orderBy(desc(profileVerificationEvents.createdAt),desc(profileVerificationEvents.id))
   .limit(50);
 return {...record,section:section,status:record.status as VerificationStatus,
  documents:verificationDocumentManifest(record.submittedSnapshot),history:events};
}
