import "server-only";
import { z } from "zod";

import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, learnerProfiles, membershipRoles, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { collegeGroupCsvPreviewSchema, neutralCsvCell } from "./college-group-csv-preview-model";
import { previewCollegeGroupCsv } from "./college-group-csv-preview-service";
import { GroupServiceError, joinGroup } from "./service";

/**
 * Deliberate confirmed write, distinct from the read-only preview.
 * Each row has its own serialized group transaction, so a bad member does not
 * roll back successfully added members. joinGroup rechecks persisted actor,
 * college, learner role, group capacity, and active status under locks.
 */
export async function confirmCollegeGroupCsv(context: RequestContext, raw: unknown) {
  const input = collegeGroupCsvPreviewSchema.parse(raw);
  const preview = await previewCollegeGroupCsv(context, input);
  const collegeId = context.membership?.collegeId;
  if (!collegeId) throw new GroupServiceError("GROUP_SCOPE_INVALID");

  const readyEmails = preview.rows.filter(row => row.status === "READY").map(row => row.email);
  const roster = readyEmails.length ? await getDb().select({
    email: users.email, membershipId: collegeMemberships.id,
  }).from(users)
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.userId, users.id),
      eq(collegeMemberships.collegeId, collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
    ))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(inArray(sql<string>`lower(${users.email})`, readyEmails)) : [];
  const idByEmail = new Map(roster.map(row => [row.email?.toLowerCase() ?? "", row.membershipId]));
  const results: {rowNumber: number; email: string; status: string}[] = [];
  let added = 0;
  let waitlisted = 0;
  for (const row of preview.rows) {
    if (row.status !== "READY") {
      results.push(row);
      continue;
    }
    const membershipId = idByEmail.get(row.email);
    if (!membershipId) {
      results.push({...row, status: "NOT_FOUND"});
      continue;
    }
    try {
      const member = await joinGroup(context, preview.groupId, membershipId, "MANUAL", true, "CSV");
      if (member.state === "ACTIVE") {
        added += 1;
        results.push({...row, status: "ADDED"});
      } else if (member.state === "WAITLISTED") {
        waitlisted += 1;
        results.push({...row, status: "WAITLISTED"});
      } else results.push({...row, status: "NOT_ADDED"});
    } catch (error) {
      results.push({...row, status: error instanceof GroupServiceError ? error.code : "IMPORT_FAILED"});
    }
  }
  const failures = results.filter(row => row.status !== "ADDED" && row.status !== "WAITLISTED");
  const errorCsv = "\ufeff" + [
    "Row,Email,Result",
    ...failures.map(row => [row.rowNumber, row.email, row.status].map(neutralCsvCell).join(",")),
  ].join("\r\n");
  return {
    groupId: preview.groupId, requested: preview.total,
    added, waitlisted, errors: failures.length, results, errorCsv,
  };
}

/** Legacy manual bulk path: resolve only active learner membership IDs or
 * college-local roll/staff-import identifiers. Never accept cross-college IDs.
 */
const manualSchema = z.strictObject({
  groupId: z.string().uuid(),
  identifierType: z.enum(["MEMBERSHIP_ID", "ROLL_NUMBER", "LEGACY_LEARNER_ID"]),
  identifiers: z.array(z.string().trim().min(1).max(128)).min(1).max(2000),
});

export async function confirmCollegeGroupManual(context: RequestContext, raw: unknown) {
  const input = manualSchema.parse(raw);
  // Same tenant/permission gate as CSV, before any learner resolution.
  const preview = await previewCollegeGroupCsv(context, {groupId: input.groupId, csv: "email\n"});
  const collegeId = context.membership?.collegeId;
  if (!collegeId) throw new GroupServiceError("GROUP_SCOPE_INVALID");
  const identifiers = [...new Set(input.identifiers)];
  const validIdentifiers = input.identifierType === "MEMBERSHIP_ID"
    ? identifiers.filter(value => z.string().uuid().safeParse(value).success)
    : identifiers;
  const matcher = input.identifierType === "MEMBERSHIP_ID"
    ? inArray(collegeMemberships.id, validIdentifiers)
    : input.identifierType === "ROLL_NUMBER"
      ? inArray(learnerProfiles.rollNumber, validIdentifiers)
      : inArray(learnerProfiles.legacyUniqueId, validIdentifiers);
  const matches = validIdentifiers.length ? await getDb().select({
    id: collegeMemberships.id,
    roll: learnerProfiles.rollNumber,
    legacy: learnerProfiles.legacyUniqueId,
  }).from(collegeMemberships)
    .innerJoin(learnerProfiles, eq(learnerProfiles.membershipId, collegeMemberships.id))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      eq(collegeMemberships.collegeId, collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      matcher,
    )) : [];
  const byIdentifier = new Map(matches.map(row => [
    input.identifierType === "MEMBERSHIP_ID" ? row.id
      : input.identifierType === "ROLL_NUMBER" ? row.roll ?? "" : row.legacy ?? "",
    row.id,
  ]));
  const results: {rowNumber:number;email:string;status:string}[] = [];
  const seen = new Set<string>();
  let added = 0, waitlisted = 0;
  for (const [index, identifier] of input.identifiers.entries()) {
    const row = {rowNumber:index+1,email:identifier};
    if (seen.has(identifier)) {
      results.push({...row,status:"DUPLICATE_INPUT"});
      continue;
    }
    seen.add(identifier);
    const membershipId = byIdentifier.get(identifier);
    if (!membershipId) {
      results.push({...row,status:"NOT_FOUND"});
      continue;
    }
    try {
      const member = await joinGroup(context, preview.groupId, membershipId, "MANUAL", true);
      if (member.state === "ACTIVE") {
        added += 1;
        results.push({...row,status:"ADDED"});
      } else if (member.state === "WAITLISTED") {
        waitlisted += 1;
        results.push({...row,status:"WAITLISTED"});
      } else results.push({...row,status:"NOT_ADDED"});
    } catch (error) {
      results.push({...row,status:error instanceof GroupServiceError?error.code:"IMPORT_FAILED"});
    }
  }
  const failures = results.filter(row=>row.status!=="ADDED"&&row.status!=="WAITLISTED");
  return {
    groupId:preview.groupId,requested:input.identifiers.length,
    added,waitlisted,errors:failures.length,results,
    errorCsv:"\ufeff"+[
      "Row,Identifier,Result",
      ...failures.map(row=>[row.rowNumber,row.email,row.status].map(neutralCsvCell).join(",")),
    ].join("\r\n"),
  };
}
