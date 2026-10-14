import "server-only";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships, lmsGroupMembers, lmsGroups, membershipRoles, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  collegeGroupCsvPreviewSchema, groupPreviewErrorCsv, parseMemberEmailCsv,
  type GroupImportRow,
} from "./college-group-csv-preview-model";

export class GroupCsvPreviewNotFoundError extends Error {
  constructor() { super("GROUP_NOT_FOUND"); this.name = "GroupCsvPreviewNotFoundError"; }
}
function ownCollege(context: RequestContext) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "academics.manage", {
      collegeId: member.collegeId, organizationId: member.organizationId,
    })) throw new AuthorizationError("academics.manage");
  requirePermission(context, "academics.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  return member.collegeId;
}
const emailSchema = z.email().max(320);

export async function previewCollegeGroupCsv(context: RequestContext, raw: unknown) {
  const input = collegeGroupCsvPreviewSchema.parse(raw);
  const collegeId = ownCollege(context);
  const db = getDb();
  const [group] = await db.select({
    id: lmsGroups.id, status: lmsGroups.status, kind: lmsGroups.kind,
    capacity: lmsGroups.capacity, activeCount: lmsGroups.activeCount,
  }).from(lmsGroups).where(and(
    eq(lmsGroups.id, input.groupId), eq(lmsGroups.collegeId, collegeId),
    eq(lmsGroups.ownerScope, "COLLEGE"), isNull(lmsGroups.deletedAt),
    eq(lmsGroups.kind, "STUDY_GROUP"),
  )).limit(1);
  if (!group) throw new GroupCsvPreviewNotFoundError();
  const parsedRows = parseMemberEmailCsv(input.csv);
  const uniqueEmails = [...new Set(parsedRows.filter(r => r.validColumns &&
    emailSchema.safeParse(r.value).success).map(r => r.value))];
  const roster = uniqueEmails.length ? await db.select({
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
    .where(inArray(sql<string>`lower(${users.email})`, uniqueEmails)) : [];
  const membershipIds = roster.map(r => r.membershipId);
  const existing = membershipIds.length ? await db.select({
    membershipId: lmsGroupMembers.membershipId,
    state: lmsGroupMembers.state,
  }).from(lmsGroupMembers)
    .where(and(
      eq(lmsGroupMembers.groupId, group.id),
      inArray(lmsGroupMembers.membershipId, membershipIds),
    )) : [];
  const rosterByEmail = new Map(roster.map(r => [r.email?.toLowerCase() ?? "", r.membershipId]));
  const memberState = new Map(existing.map(r => [r.membershipId, r.state]));
  const seen = new Set<string>();
  let available = group.capacity === null ? Number.MAX_SAFE_INTEGER
    : Math.max(0, group.capacity - group.activeCount);
  const rows: GroupImportRow[] = parsedRows.map(row => {
    let status: GroupImportRow["status"];
    if (!row.validColumns) status = "COLUMN_COUNT";
    else if (!emailSchema.safeParse(row.value).success) status = "INVALID_EMAIL";
    else if (seen.has(row.value)) status = "DUPLICATE_CSV";
    else {
      seen.add(row.value);
      const memberId = rosterByEmail.get(row.value);
      if (!memberId) status = "NOT_FOUND";
      else if (memberState.has(memberId)) status =
        memberState.get(memberId) === "REMOVED" ? "PREVIOUSLY_REMOVED" : "ALREADY_MEMBER";
      else if (group.status !== "ACTIVE" || available === 0) status = "CAPACITY_FULL";
      else { available -= 1; status = "READY"; }
    }
    return { rowNumber: row.rowNumber, email: row.value, status };
  });
  const ready = rows.filter(r => r.status === "READY").length;
  return {
    groupId: group.id,
    status: group.status,
    capacity: group.capacity,
    ready, blocked: rows.length - ready, total: rows.length, rows,
    warning: group.status === "ACTIVE"
      ? "Dry run only. Memberships and capacity may change before an actual import."
      : "Group is not ACTIVE; all otherwise eligible rows are blocked. No membership changes were made.",
    errorCsv: groupPreviewErrorCsv(rows),
  };
}
