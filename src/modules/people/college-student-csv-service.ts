import "server-only";
import {createHash, randomUUID} from "node:crypto";
import { z } from "zod";

import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {activityEvents, cohorts, collegeMemberships, departments, learnerImportBatchMembers, learnerImportBatches, learnerProfiles, programs, sections, users } from "@/db/schema";
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
  const parsed = parseStudentCsv(request.csv, {
    ...(request.programId !== undefined ? {programId:request.programId} : {}),
    ...(request.cohortId !== undefined ? {cohortId:request.cohortId} : {}),
    ...(request.sectionId !== undefined ? {sectionId:request.sectionId} : {}),
  });
  if (parsed.structuralErrors.length) {
    return { preview: true, structuralErrors: parsed.structuralErrors,
      results: [] as StudentCsvResult[], valid: 0, invalid: 0 };
  }

  // Replaying the exact same confirmed source is a read of its existing
  // import receipt, never another identity-provisioning operation. This
  // includes PARTIAL runs: those require reconciliation of the minted
  // membership rather than blindly creating a second learner.
  const sourceFingerprint = createHash("sha256").update(JSON.stringify({
    csv: request.csv, programId: request.programId ?? null,
    cohortId: request.cohortId ?? null, sectionId: request.sectionId ?? null,
  })).digest("hex");
  if (request.action === "IMPORT") {
    const [prior] = await getDb().select({
      runId: activityEvents.subjectId, metadata: activityEvents.metadata,
    }).from(activityEvents).where(and(
      eq(activityEvents.collegeId, member.collegeId),
      eq(activityEvents.actorUserId, context.user.id),
      eq(activityEvents.eventType, "IDENTITY_COLLEGE_STUDENT_CSV_IMPORT"),
      sql`${activityEvents.metadata}->>'sourceFingerprint' = ${sourceFingerprint}`,
    )).orderBy(desc(activityEvents.occurredAt)).limit(1);
    const receiptSchema = z.object({
      receipts: z.array(z.object({
        row: z.number().int().positive(),
        status: z.enum(["VALID", "INVALID", "IMPORTED", "FAILED", "PARTIAL"]),
        membershipId: z.string().uuid().nullable(),
        enrollmentId: z.string().uuid().nullable(),
      })),
    });
    const previous = receiptSchema.safeParse(prior?.metadata);
    if (prior && previous.success && previous.data.receipts.length === parsed.entries.length) {
      const results: StudentCsvResult[] = previous.data.receipts.map(receipt => ({
        row: receipt.row, status: receipt.status,
        detail: receipt.status === "PARTIAL"
          ? "Previously partially imported. Reconcile the existing membership before any new import."
          : "Previously processed in this college. No duplicate learner was created.",
        ...(receipt.membershipId ? {membershipId: receipt.membershipId} : {}),
        ...(receipt.enrollmentId ? {enrollmentId: receipt.enrollmentId} : {}),
      }));
      // Replay receipts must report the original outcomes, not count failed
      // onboarding or partial rows as successfully validated learners.
      const invalid = results.filter(row => row.status === "INVALID").length;
      return { preview: false, structuralErrors: [], results,
        valid: results.length - invalid, invalid,
        runId: prior.runId, bulkImportBatchId: prior.runId,
        learnerCount: results.filter(row => row.membershipId !== undefined).length,
        reversible: false,
        recoveryRequired: results.some(row => row.status === "PARTIAL" || row.status === "FAILED"),
        alreadyProcessed: true };
    }
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
  // Reject collisions within this file before any identity writer runs. The
  // database preflight above only detects identities from previous imports;
  // without this guard two rows in one import can provision the same account.
  const countBy = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return counts;
  };
  const phoneCounts = countBy(incoming.map(row => row.phoneE164));
  const emailCounts = countBy(incoming.flatMap(row =>
    row.email ? [row.email.trim().toLowerCase()] : []));
  const rollCounts = countBy(incoming.flatMap(row =>
    row.rollNumber ? [row.rollNumber.trim().toLowerCase()] : []));
  const checked = parsed.entries.map(entry => {
    const errors = [...entry.errors];
    const cohort = entry.data ? validCohorts.get(entry.data.cohortId) : undefined;
    if (entry.data && (!cohort || cohort.programId !== entry.data.programId ||
      cohort.programStatus !== "ACTIVE" ||
      !["ACTIVE", "PLANNED"].includes(cohort.cohortStatus))) {
      errors.push("PROGRAM_COHORT_UNAVAILABLE");
    }
    if(entry.data){
      if ((phoneCounts.get(entry.data.phoneE164) ?? 0) > 1)
        errors.push("DUPLICATE_PHONE_IN_IMPORT");
      if (entry.data.email && (emailCounts.get(entry.data.email.trim().toLowerCase()) ?? 0) > 1)
        errors.push("DUPLICATE_EMAIL_IN_IMPORT");
      if (entry.data.rollNumber && (rollCounts.get(entry.data.rollNumber.trim().toLowerCase()) ?? 0) > 1)
        errors.push("DUPLICATE_ROLL_IN_IMPORT");
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
  // The run ID is the durable import-batch identity used by history and
  // manual recovery. Individual membership IDs are recorded in the receipt.
  const runId = randomUUID();
  // DB02 (0167): durable, college-scoped batch provenance. The ledger must
  // exist BEFORE the first identity is provisioned so every successful
  // membership can be linked immediately. It is an audit source, NOT an
  // automatic deletion/undo instruction.
  await getDb().insert(learnerImportBatches).values({
    id:runId,collegeId:member.collegeId,createdByUserId:context.user.id,
  });
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
      const registered=await getDb().insert(learnerImportBatchMembers).values({
        batchId:runId,collegeId:member.collegeId,membershipId,
      }).onConflictDoNothing()
        .returning({membershipId:learnerImportBatchMembers.membershipId});
      if(registered.length!==1)throw new Error("MEMBERSHIP_BATCH_ALREADY_LINKED");
    }catch{
      results.push({row:entry.row,status:"PARTIAL",
        detail:"Membership created but batch lineage could not be recorded. Review this membership and its college before retrying.",
        membershipId});
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
    runId,bulkImportBatchId:runId,
    learnerCount:results.filter(item=>item.membershipId !== undefined).length,
    createdMembershipIds:receipts.filter(x=>x.membershipId).map(x=>x.membershipId),
    actorRole:isSuperAdmin(context)?"SUPER_ADMIN":"COLLEGE_ADMIN",
    selectedCollegeId:member.collegeId,sourceFingerprint, receipts,
    recoveryPolicy:"MANUAL_RECONCILIATION_REQUIRED_FOR_PARTIAL",
    batchLineageTable:"learner_import_batch_members",
    undoPolicy:"DISABLED_UNTIL_REFERENTIAL_DEPENDENCY_REVIEW",
    reversible:false},
  });
  return { preview: false, structuralErrors: [], results, valid: valid.length, invalid,
    runId,bulkImportBatchId:runId,
    learnerCount:results.filter(item=>item.membershipId !== undefined).length,
    reversible:false, recoveryRequired:results.some(item=>item.status==="PARTIAL") };
}

/** Both administrator history views are strictly scoped to their authorized college. */
export async function listCollegeStudentCsvImportHistory(context: RequestContext) {
  const selected = isSuperAdmin(context)
    ? await resolveActingCollege(context, "people.manage")
    : requireCollegeStudentImporter(context);
  requirePermission(context, "people.manage", {
    collegeId: selected.collegeId, organizationId: selected.organizationId,
  });
  return getDb().select({
    runId:activityEvents.subjectId,
    occurredAt:activityEvents.occurredAt,
    actorUserId:activityEvents.actorUserId,
    metadata:activityEvents.metadata,
  }).from(activityEvents).where(and(
    eq(activityEvents.collegeId,selected.collegeId),
    eq(activityEvents.organizationId,selected.organizationId),
    eq(activityEvents.eventType,"IDENTITY_COLLEGE_STUDENT_CSV_IMPORT"),
  )).orderBy(desc(activityEvents.occurredAt)).limit(50);
}

/** Preserve the existing Super Admin history entry point without widening access. */
export async function listSuperAdminStudentCsvImportHistory(context: RequestContext) {
  if (!isSuperAdmin(context)) throw new AuthorizationError("people.manage");
  return listCollegeStudentCsvImportHistory(context);
}
