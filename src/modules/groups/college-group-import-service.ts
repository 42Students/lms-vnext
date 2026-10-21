import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, membershipRoles, users } from "@/db/schema";
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
