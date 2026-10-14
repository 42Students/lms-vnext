import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cohorts, departments, programs } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import { onboardPersonWithRuntime } from "./runtime";
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
  const member = requireCollegeStudentImporter(context);
  const parsed = parseStudentCsv(request.csv);
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
  const checked = parsed.entries.map(entry => {
    const errors = [...entry.errors];
    const cohort = entry.data ? validCohorts.get(entry.data.cohortId) : undefined;
    if (entry.data && (!cohort || cohort.programId !== entry.data.programId ||
      cohort.programStatus !== "ACTIVE" ||
      !["ACTIVE", "PLANNED"].includes(cohort.cohortStatus))) {
      errors.push("PROGRAM_COHORT_UNAVAILABLE");
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
      results.push({ row: entry.row, status: "IMPORTED", detail: "Learner onboarded and enrolled",
        membershipId, enrollmentId: enrollment.id });
    } catch {
      results.push({ row: entry.row, status: "PARTIAL",
        detail: "Membership onboarded but enrollment failed; enroll this membership manually before retrying",
        membershipId });
    }
  }
  return { preview: false, structuralErrors: [], results, valid: valid.length, invalid };
}
