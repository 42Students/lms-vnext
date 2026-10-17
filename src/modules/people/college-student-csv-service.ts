import "server-only";
import {randomUUID} from "node:crypto";

import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {activityEvents, cohorts, departments, programs, sections } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import { onboardPersonWithRuntime, upsertLearnerProfileWithRuntime } from "./runtime";
import { placeImportedLearnerInSection } from "./college-student-import-placement";
import {
  parseStudentCsv, studentCsvRequestSchema,
  type StudentCsvResult, type StudentCsvRow,
} from "./college-student-csv-model";

export function requireCollegeStudentImporter(context: RequestContext) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "people.manage", {
      collegeId: member.collegeId, organizationId: member.organizationId,
    }) ||
    !can(context, "academics.manage", {
      collegeId: member.collegeId, organizationId: member.organizationId,
    })) throw new AuthorizationError("people.manage");
  requirePermission(context, "people.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  requirePermission(context, "academics.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  return member;
}

/** Bulk transport orchestrator; canonical identity/onboard and enrollment services own writes/audit. */
export async function runCollegeStudentCsv(context: RequestContext, raw: unknown) {
  const request = studentCsvRequestSchema.parse(raw);
  // SA-academics-people-95: the selected, active college is authoritative.
  // Other college memberships may not silently supply an import target.
  const member = isSuperAdmin(context)
    ? await resolveActingCollege(context, "people.manage")
    : requireCollegeStudentImporter(context);
  requirePermission(context, "academics.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  const parsed = parseStudentCsv(request.csv, request);
  if (parsed.structuralErrors.length) {
    return { preview: true, structuralErrors: parsed.structuralErrors,
      results: [] as StudentCsvResult[], valid: 0, invalid: 0 };
  }

  const uniqueCohorts = [...new Set(parsed.entries.flatMap(entry =>
    entry.data ? [entry.data.cohortId] : []))];
  const available = uniqueCohorts.length ? await getDb().select({
    cohortId: cohorts.id,
    programId: cohorts.programId,
    cohortStatus: cohorts.status,
    programStatus: programs.status,
  }).from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, member.collegeId),
    ))
    .where(inArray(cohorts.id, uniqueCohorts)) : [];
  const validCohorts = new Map(available.map(c => [c.cohortId, c]));
  const sectionIds = [...new Set(parsed.entries.flatMap(entry =>
    entry.data?.sectionId ? [entry.data.sectionId] : []))];
  const rows = sectionIds.length ? await getDb().select({
    id: sections.id, cohortId: sections.cohortId, status: sections.status,
  }).from(sections).innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(eq(departments.collegeId, member.collegeId),
      inArray(sections.id, sectionIds))) : [];
  const validSections = new Map(rows.map(row => [row.id, row]));
  const checked = parsed.entries.map(entry => {
    const errors = [...entry.errors];
    const cohort = entry.data ? validCohorts.get(entry.data.cohortId) : undefined;
    if (entry.data && (!cohort || cohort.programId !== entry.data.programId ||
      cohort.programStatus !== "ACTIVE" ||
      !["ACTIVE", "PLANNED"].includes(cohort.cohortStatus))) {
      errors.push("PROGRAM_COHORT_UNAVAILABLE");
    }
    if (entry.data?.sectionId) {
      const section = validSections.get(entry.data.sectionId);
      if (!section || section.status !== "ACTIVE" || section.cohortId !== entry.data.cohortId)
        errors.push("CLASS_BATCH_MISMATCH");
    }
    return { ...entry, errors };
  });
  const initial: StudentCsvResult[] = checked.map(entry => ({
    row: entry.row,
    status: entry.errors.length ? "INVALID" : "VALID",
    detail: entry.errors.join("; ") || "Validated fields and college-owned cohort; existing identity conflicts are checked during import",
  }));
  const valid = checked.filter(entry => entry.data && entry.errors.length === 0);
  const invalid = checked.length - valid.length;
  if (request.action === "PREVIEW") {
    return { preview: true, structuralErrors: [], results: initial,
      valid: valid.length, invalid };
  }

  // No cross-system ACID transaction exists between identity provisioning and
  // PostgreSQL enrollments; report each completed stage truthfully.
  const results: StudentCsvResult[] = [];
  for (const entry of checked) {
    if (entry.errors.length || !entry.data) {
      results.push({ row: entry.row, status: "INVALID",
        detail: entry.errors.join("; ") || "Invalid row" });
      continue;
    }
    const data: StudentCsvRow = entry.data;
    let membershipId: string;
    try {
      const person = await onboardPersonWithRuntime(context, {
        collegeId: member.collegeId,
        displayName: data.displayName,
        phoneE164: data.phoneE164,
        ...(data.email ? { email: data.email } : {}),
        roles: ["LEARNER"],
      });
      membershipId = person.membership.id;
    } catch {
      results.push({ row: entry.row, status: "FAILED",
        detail: "Identity or college membership onboarding failed; check manually before retrying" });
      continue;
    }
    try {
      const enrollment = await createLearnerProgramEnrollment(context, {
        membershipId,
        programId: data.programId,
        cohortId: data.cohortId,
      });
      const partial: string[] = [];
      if (data.rollNumber) {
        try { await upsertLearnerProfileWithRuntime(context, membershipId, {
          rollNumber: data.rollNumber, registrationNumber: null,
        }); } catch { partial.push("Roll number update failed"); }
      }
      if (data.sectionId) {
        try { await placeImportedLearnerInSection(context, enrollment.id, data.sectionId); }
        catch (reason) {
          partial.push(reason instanceof Error ? "Class placement failed: " + reason.message : "Class placement failed");
        }
      }
      results.push({ row: entry.row, status: partial.length ? "PARTIAL" : "IMPORTED",
        detail: partial.length ? "Onboarded and enrolled; " + partial.join("; ") :
          "Learner onboarded, enrolled" + (data.sectionId ? " and placed in class" : ""),
        membershipId, enrollmentId: enrollment.id });
    } catch {
      results.push({ row: entry.row, status: "PARTIAL",
        detail: "Membership onboarded but enrollment failed; enroll this membership manually before retrying",
        membershipId });
    }
  }
  const runId=randomUUID();
  await getDb().insert(activityEvents).values({
   organizationId:member.organizationId,collegeId:member.collegeId,
   actorUserId:context.user.id,actorMembershipId:context.membership?.collegeId===member.collegeId?context.membership.id:null,
   module:"IDENTITY",eventType:"IDENTITY_COLLEGE_STUDENT_CSV_IMPORT",
   subjectType:"college_student_import",subjectId:runId,
   summary:"College Student CSV import completed",
   metadata:{count:results.length,created:results.filter(x=>x.status==="IMPORTED").length,
    partial:results.filter(x=>x.status==="PARTIAL").length,
    failed:results.filter(x=>["INVALID","FAILED"].includes(x.status)).length},
  });
  return { preview: false, structuralErrors: [], results, valid: valid.length, invalid,runId };
}

/** SA-academics-people-95: history reads use the same selected active college as imports. */
export async function listSuperAdminStudentCsvImportHistory(context: RequestContext) {
  if (!isSuperAdmin(context)) throw new AuthorizationError("people.manage");
  const selected = await resolveActingCollege(context, "people.manage");
  return getDb().select({
    occurredAt:activityEvents.occurredAt,
    metadata:activityEvents.metadata,
  }).from(activityEvents).where(and(
    eq(activityEvents.collegeId,selected.collegeId),
    eq(activityEvents.organizationId,selected.organizationId),
    eq(activityEvents.eventType,"IDENTITY_COLLEGE_STUDENT_CSV_IMPORT"),
  )).orderBy(desc(activityEvents.occurredAt)).limit(50);
}
