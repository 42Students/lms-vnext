import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, learnerProfiles } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
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

/** A partial receipt is essential: canonical identity provisioning and
 * academic enrollment are separate writers and cannot be rolled back together. */
export async function registerCollegeStudent(context: RequestContext, raw: unknown) {
  const input = collegeStudentRegistrationSchema.parse(raw);
  const member = await resolveActingCollege(context,"people.manage");
  requirePermission(context, "people.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  requirePermission(context, "academics.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
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
    });
  } catch {
    failures.push("Student personal details need updating in the profile.");
  }
  if (enrollmentId && input.sectionId) {
    try { await placeImportedLearnerInSection(context,enrollmentId,input.sectionId); }
    catch { failures.push("Class placement failed; place the student from the directory."); }
  }
  return {
    membershipId: person.membership.id, enrollmentId,
    status: failures.length ? "PARTIAL" as const : "REGISTERED" as const,
    failures,
  };
}
