import "server-only";
import {createHash, randomUUID} from "node:crypto";

import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {activityEvents, cohorts, collegeMemberships, departments, learnerProfiles, programs, sections, users } from "@/db/schema";
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
  // Privacy-conscious preflight: only return a per-row conflict code, never
  // reveal the identity, college or personal details behind an existing phone.
  const incoming = parsed.entries.flatMap(entry=>entry.data?[entry.data]:[]);
  const phones=[...new Set(incoming.map(entry=>entry.phoneE164))];
  const emails=[...new Set(incoming.map(entry=>entry.email?.toLowerCase()).filter(
    (value):value is string=>Boolean(value)))];
  const rolls=[...new Set(incoming.map(entry=>entry.rollNumber?.trim().toLowerCase()).filter(
    (value):value is string=>Boolean(value)))];
  const existingIdentities=phones.length||emails.length?await getDb().select({
    phone:users.phoneE164,email:users.email,
  }).from(users).where(or(
    phones.length?inArray(users.phoneE164,phones):undefined,
    emails.length?inArray(sql<string>`lower(${users.email})`,emails):undefined,
  )):[];
  const existingRolls=rolls.length?await getDb().select({
    roll:learnerProfiles.rollNumber,
  }).from(learnerProfiles).innerJoin(collegeMemberships,
    eq(collegeMemberships.id,learnerProfiles.membershipId))
    .where(and(eq(collegeMemberships.collegeId,member.collegeId),
      inArray(sql<string>`lower(${learnerProfiles.rollNumber})`,rolls))):[];
  const takenPhones=new Set(existingIdentities.map(row=>row.phone).filter(Boolean));
  const takenEmails=new Set(existingIdentities.map(row=>row.email?.toLowerCase()).filter(Boolean));
  const takenRolls=new Set(existingRolls.map(row=>row.roll?.trim().toLowerCase()).filter(Boolean));
  const checked = parsed.entries.map(entry => {
    const errors = [...entry.errors];
    const cohort = entry.data ? validCohorts.get(entry.data.cohortId) : undefined;
    if (entry.data && (!cohort || cohort.programId !== entry.data.programId ||
      cohort.programStatus !== "ACTIVE" ||
      !["ACTIVE", "PLANNED"].includes(cohort.cohortStatus))) {
      errors.push("PROGRAM_COHORT_UNAVAILABLE");
    }
    if(entry.data){
      if(takenPhones.has(entry.data.phoneE164))errors.push("PHONE_ALREADY_REGISTERED");
      if(entry.data.email&&takenEmails.has(entry.data.email.toLowerCase()))
        errors.push("EMAIL_ALREADY_REGISTERED");
      if(entry.data.rollNumber&&takenRolls.has(entry.data.rollNumber.trim().toLowerCase()))
        errors.push("ROLL_NUMBER_ALREADY_REGISTERED");
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
    detail: entry.errors.join("; ") || "Validated fields, college-owned cohort and existing identity conflicts",
  }));
  const valid = checked.filter(entry => entry.data && entry.errors.length === 0);
  const invalid = checked.length - valid.length;
  if (request.action === "PREVIEW") {
    return { preview: true, structuralErrors: [], results: initial,
      valid: valid.length, invalid };
  }
  // COL-people-R03: import is never a permissive "skip bad rows" action.
  // Revalidate the complete submitted roster on the server and refuse the
  // whole request when any parsed row or ownership check fails.
  if (invalid > 0) {
    return { preview: true, structuralErrors: ["RESOLVE_INVALID_ROWS_BEFORE_IMPORT"],
      results: initial, valid: valid.length, invalid };
  }

  // No cross-system ACID transaction exists between identity provisioning and
  // PostgreSQL enrollments; report each completed stage truthfully.
  // This digest binds a manual recovery receipt to the exact upload AND the
  // selected academic options; do not persist the CSV or any raw contact here.
  // A digest is not a durable row-level idempotency key or undo ledger.
  const sourceFingerprint = createHash("sha256").update(JSON.stringify({
    csv: request.csv, programId: request.programId ?? null,
    cohortId: request.cohortId ?? null, sectionId: request.sectionId ?? null,
  })).digest("hex");
  const runId = randomUUID();
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
        catch {
          // COL-people-05/25: never export internal DB errors in a learner import receipt.
          partial.push("Class placement failed; review section capacity and learner eligibility");
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
  // Preserve only stage/status and minted UUIDs for operator triage. Never
  // infer a safe rollback from this immutable audit receipt: external identity
  // creation and downstream enrollments cannot be reversed atomically.
  const receipts = results.map(result => ({
    row: result.row, status: result.status,
    membershipId: result.membershipId ?? null,
    enrollmentId: result.enrollmentId ?? null,
  }));
  await getDb().insert(activityEvents).values({
   organizationId:member.organizationId,collegeId:member.collegeId,
   actorUserId: context.user.id,
   // A Super Admin may act in a different college; never attribute the event
   // to an unrelated membership (and keep the UUID insert type precise).
   actorMembershipId: context.membership?.collegeId === member.collegeId &&
     context.membership.organizationId === member.organizationId
       ? context.membership.id : null,
   module:"IDENTITY",eventType:"IDENTITY_COLLEGE_STUDENT_CSV_IMPORT",
   subjectType:"college_student_import",subjectId:runId,
   summary:"College Student CSV import completed",
   metadata:{count:results.length,created:results.filter(x=>x.status==="IMPORTED").length,
    partial:results.filter(x=>x.status==="PARTIAL").length,
    failed:results.filter(x=>["INVALID","FAILED"].includes(x.status)).length,
    sourceFingerprint, receipts,
    recoveryPolicy:"MANUAL_RECONCILIATION_REQUIRED_FOR_PARTIAL",
    reversible:false},
  });
  return { preview: false, structuralErrors: [], results, valid: valid.length, invalid,runId,
    reversible:false, recoveryRequired:results.some(item=>item.status==="PARTIAL") };
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
