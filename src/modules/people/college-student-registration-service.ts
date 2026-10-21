import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { academicPeriods, cohorts, collegeMemberships, departments, learnerProfiles, programs, sections } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import { AcademicsServiceError } from "@/modules/academics/errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import { placeImportedLearnerInSection } from "./college-student-import-placement";
import { learnerProfileDocumentSchema } from "./profile-validation";
import { onboardPersonWithRuntime, upsertLearnerProfileWithRuntime } from "./runtime";

export const collegeStudentRegistrationSchema = z.object({
  displayName: z.string().trim().min(2).max(255),
  phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/),
  email: z.union([z.email(), z.literal("")]).optional(),
  programId: z.string().uuid(),
  cohortId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  rollNumber: z.string().trim().max(128).default(""),
  gender: z.enum(["","Male","Female","Other","Prefer not to say"]).default(""),
  dateOfBirth: z.union([z.iso.date(), z.literal("")]).default(""),
  address: z.string().trim().max(1000).default(""),
}).strict();

/**
 * Legacy registration crosswalk: first_name + last_name -> displayName;
 * contact_mobile/mail -> canonical E.164 phone and email; college_id ->
 * authorized acting college; program_id -> programId; class_id -> sectionId
 * under cohortId; roll_number -> learner profile rollNumber; gender/DOB/
 * address -> profileDocument. A vNext learner is user + college membership +
 * program/cohort enrollment + optional section enrollment, not a numeric row.
 * Batch-first enrollment, optional roll/class and required verified sign-in
 * phone are intentional vNext constraints; never invent historical numeric ID.
 * A partial receipt is essential: identity provisioning and academic enrollment
 * are separate writers and cannot be rolled back together or blindly retried.
 */
export async function registerCollegeStudent(context: RequestContext, raw: unknown) {
  const input = collegeStudentRegistrationSchema.parse(raw);
  const member = await resolveActingCollege(context,"people.manage");
  requirePermission(context, "people.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  requirePermission(context, "academics.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  // All required academic choices must be checked before provisioning the
  // canonical login identity. The enrollment/placement writers still repeat
  // these checks under their own transaction to close races.
  const [academic] = await getDb().select({
    cohortStatus:cohorts.status, programStatus:programs.status,
  }).from(cohorts)
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(and(eq(cohorts.id,input.cohortId),eq(programs.id,input.programId),
      eq(departments.collegeId,member.collegeId))).limit(1);
  if(!academic || academic.programStatus!=="ACTIVE" ||
    (academic.cohortStatus!=="PLANNED"&&academic.cohortStatus!=="ACTIVE"))
    throw new AcademicsServiceError("COHORT_PROGRAM_MISMATCH");
  if(input.sectionId){
    const [section]=await getDb().select({id:sections.id})
      .from(sections)
      .innerJoin(academicPeriods,eq(academicPeriods.id,sections.academicPeriodId))
      .where(and(eq(sections.id,input.sectionId),eq(sections.cohortId,input.cohortId),
        eq(academicPeriods.collegeId,member.collegeId),
        eq(sections.status,"ACTIVE"))).limit(1);
    if(!section)throw new AcademicsServiceError("CLASS_BATCH_MISMATCH");
  }
  const person = await onboardPersonWithRuntime(context, {
    collegeId: member.collegeId, displayName: input.displayName,
    phoneE164: input.phoneE164,
    ...(input.email ? {email:input.email} : {}),
    roles: ["LEARNER"],
  });
  const failures: string[] = [];
  let enrollmentId: string | null = null;
  try {
    const enrollment = await createLearnerProgramEnrollment(context, {
      membershipId: person.membership.id, programId:input.programId, cohortId:input.cohortId,
    });
    enrollmentId = enrollment.id;
  } catch {
    failures.push("Program/batch enrollment failed. Complete enrollment from the student directory.");
  }
  try {
    await upsertLearnerProfileWithRuntime(context, person.membership.id, {
      rollNumber: input.rollNumber || null, registrationNumber: null,
    });
    await getDb().transaction(async tx => {
      const [existing] = await tx.select({document:learnerProfiles.profileDocument})
        .from(learnerProfiles)
        .innerJoin(collegeMemberships, eq(collegeMemberships.id, learnerProfiles.membershipId))
        .where(and(eq(learnerProfiles.membershipId, person.membership.id),
          eq(collegeMemberships.collegeId, member.collegeId))).for("update").limit(1);
      if (!existing) throw Error("STUDENT_PROFILE_NOT_FOUND");
      const doc = learnerProfileDocumentSchema.parse({
        ...existing.document,
        personalDetails: {
          ...(typeof existing.document.personalDetails === "object" && existing.document.personalDetails !== null
            ? existing.document.personalDetails : {}),
          gender: input.gender, dateOfBirth: input.dateOfBirth,
        },
        address: {
          ...(typeof existing.document.address === "object" && existing.document.address !== null
            ? existing.document.address : {}),
          currentAddress: input.address,
        },
      });
      await tx.update(learnerProfiles).set({
        profileDocument: doc, updatedAt: new Date(),
      }).where(eq(learnerProfiles.membershipId, person.membership.id));
      // Unlike legacy AdminAuditLog's numeric learner ID, every registration
      // stage links back to the same tenant-scoped membership UUID. Commit the
      // personal-details audit alongside the personal-details write.
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.IDENTITY_LEARNER_PROFILE_SECTION_UPDATED,
        collegeId:member.collegeId,organizationId:member.organizationId,
        subjectType:"learner_profile",subjectId:person.membership.id,
        summary:"College Admin registered learner personal details",
        metadata:{membershipId:person.membership.id,enrollmentId,
          changedFields:["rollNumber","personalDetails","address"],
          source:"college-student-registration"},
      });
    });
  } catch {
    failures.push("Student personal details need updating in the profile.");
  }
  if (enrollmentId && input.sectionId) {
    try { await placeImportedLearnerInSection(context,enrollmentId,input.sectionId); }
    catch { failures.push("Class placement failed; place the student from the directory."); }
  }
  // Identity creation (IDENTITY_PERSON_ONBOARDED), program enrollment
  // (ACADEMICS_LEARNER_ENROLLED), optional class placement
  // (ACADEMICS_CLASS_UPDATED), and the profile event above form the audit
  // trail. New accounts use OTP at login; registration does not send an SMS
  // or mail blast. Identity and academic writers can succeed independently.
  return {
    membershipId: person.membership.id, enrollmentId,
    auditReferences:{membershipId:person.membership.id,enrollmentId,
      sectionId:input.sectionId??null},
    externalNotificationsQueued:false as const,
    status: failures.length ? "PARTIAL" as const : "REGISTERED" as const,
    failures,
  };
}
