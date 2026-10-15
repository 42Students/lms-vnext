import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementJobs } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireTpoReadCollege } from "../tpo-surface-access";
import { companyShareTablesReady } from "./readiness";
import { placementCompanyApplicantShares as shares } from "./staged-schema";
import {
  companyShareExpiry, companyShareIssueSchema,
  companyShareRevokeSchema, issueCompanyShareToken,
} from "./token-model";

export class CompanyShareError extends Error {
  constructor(public readonly code: "MIGRATION_PENDING"|"NOT_FOUND"|"NOT_SHAREABLE") {
    super(code);
  }
}
export function isShareableJob(
  expectedCollege: string, actualCollege: string | null, status: string | null,
) {
  return expectedCollege === actualCollege && (status === "PUBLISHED" || status === "CLOSED");
}
async function tpoJob(context: RequestContext, jobId: string) {
  const college = await requireTpoReadCollege(context);
  const [job] = await getDb().select({
    id: placementJobs.id, collegeId: placementJobs.collegeId,
    status: placementJobs.status,
  }).from(placementJobs).where(and(
    eq(placementJobs.id, jobId), eq(placementJobs.collegeId,college.id),
  )).limit(1);
  if (!isShareableJob(college.id,job?.collegeId??null,job?.status??null)) {
    throw new CompanyShareError("NOT_FOUND");
  }
  return college;
}
export async function issueTpoCompanyApplicantShare(context: RequestContext, raw: unknown) {
  const parsed = companyShareIssueSchema.parse(raw);
  const college = await tpoJob(context,parsed.jobId);
  if (!await companyShareTablesReady()) throw new CompanyShareError("MIGRATION_PENDING");
  if (!context.membership) throw new CompanyShareError("NOT_FOUND");
  const {token,digest} = issueCompanyShareToken();
  const expiresAt = companyShareExpiry(new Date(),parsed.expiresInDays);
  const [row] = await getDb().insert(shares).values({
    collegeId:college.id, jobId:parsed.jobId,
    createdByMembershipId:context.membership.id,
    tokenHash:digest, expiresAt,
  }).returning({id:shares.id});
  if (!row) throw new CompanyShareError("NOT_SHAREABLE");
  return {shareId:row.id,token,expiresAt:expiresAt.toISOString()};
}
export async function listTpoCompanyApplicantShares(context: RequestContext, rawJobId: unknown) {
  const jobId = companyShareIssueSchema.shape.jobId.parse(rawJobId);
  const college = await tpoJob(context,jobId);
  if (!await companyShareTablesReady()) return {ready:false,links:[]};
  const links = await getDb().select({
    id:shares.id, expiresAt:shares.expiresAt, revokedAt:shares.revokedAt,
    createdAt:shares.createdAt,
  }).from(shares).where(and(eq(shares.collegeId,college.id),eq(shares.jobId,jobId)))
    .orderBy(desc(shares.createdAt),desc(shares.id)).limit(50);
  return {ready:true,links};
}
export async function revokeTpoCompanyApplicantShare(context: RequestContext, raw: unknown) {
  const input = companyShareRevokeSchema.parse(raw);
  const college = await tpoJob(context,input.jobId);
  if (!await companyShareTablesReady()) throw new CompanyShareError("MIGRATION_PENDING");
  const [updated] = await getDb().update(shares).set({revokedAt:new Date()})
    .where(and(eq(shares.id,input.shareId),eq(shares.collegeId,college.id),
      eq(shares.jobId,input.jobId),isNull(shares.revokedAt)))
    .returning({id:shares.id});
  // Unknown, foreign and previously-revoked ids are indistinguishable.
  if (!updated) throw new CompanyShareError("NOT_FOUND");
  return {revoked:true};
}
