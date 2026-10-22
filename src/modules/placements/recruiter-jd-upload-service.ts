import "server-only";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, placementCompanies, placementCompanyRelationships, placementRecruiterCollegeGrants, users } from "@/db/schema";
import { can } from "@/modules/permissions/policy";
import { hasActiveRecruiter, type RequestContext } from "@/modules/identity/context";
import { recruiterGrantEffectiveAt } from "./recruiter-grant-expiry-policy";
import {
  createPrivateUploadGrant, createPrivateReadGrant, readPrivateObjectAttestation,
} from "@/modules/storage/private-object-storage";

const uuid = z.string().uuid();
const keySchema = z.string().regex(
  /^private\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/placement-document\/[0-9a-f-]{36}$/i,
);
const types = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;
const maxBytes = 5 * 1024 * 1024;

async function requireRecruiterStorageScope(context: RequestContext, rawCollegeId: string) {
  const collegeId = uuid.parse(rawCollegeId);
  if (context.user.platformStatus !== "ACTIVE" ||
      !hasActiveRecruiter(context) || !context.recruiter ||
      context.recruiter.userId !== context.user.id)
    throw new Error("JD_ACCESS_DENIED");
  const grant = context.recruiter.grants.find(item => item.collegeId === collegeId);
  if (!grant || !can(context, "placements.recruiter.read", {
        collegeId, placementCompanyRelationshipId: grant.companyRelationshipId,
      })) throw new Error("JD_ACCESS_DENIED");
  // Context grants only contain identity, not expiry/verification. Confirm
  // persisted capability and active company/college on every grant request.
  const [record] = await getDb().select({
    grant: placementRecruiterCollegeGrants,
  }).from(placementRecruiterCollegeGrants)
    .innerJoin(placementCompanyRelationships, eq(
      placementCompanyRelationships.id, placementRecruiterCollegeGrants.companyRelationshipId))
    .innerJoin(placementCompanies, eq(placementCompanies.id, placementCompanyRelationships.companyId))
    .innerJoin(colleges, eq(colleges.id, placementCompanyRelationships.collegeId))
    .innerJoin(users, eq(users.id, placementRecruiterCollegeGrants.recruiterUserId))
    .where(and(
      eq(placementRecruiterCollegeGrants.id, grant.id),
      eq(placementRecruiterCollegeGrants.recruiterUserId, context.user.id),
      eq(placementCompanyRelationships.id, grant.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, collegeId),
      eq(placementCompanyRelationships.status, "ACTIVE"),
      eq(placementCompanies.id, context.recruiter.companyId),
      eq(placementCompanies.status, "ACTIVE"),
      eq(colleges.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    )).limit(1);
  if (!record || !recruiterGrantEffectiveAt(record.grant, new Date(), "DRIVES"))
    throw new Error("JD_ACCESS_DENIED");
  // A recruiter is not a college member. Use their authenticated user UUID as
  // the storage owner segment, never a client-provided membership or key prefix.
  return { collegeId, ownerMembershipId: context.user.id };
}

export function validateRecruiterJdFile(input: {
  originalName: string; contentType: string; sizeBytes: number;
}) {
  const originalName = input.originalName.trim();
  const suffix = originalName.split(".").pop()?.toLowerCase();
  if (!suffix || !(suffix in types) ||
      originalName.length > 255 || /[\/\\\x00-\x1f\x7f]/.test(originalName))
    throw new Error("JD_FILE_TYPE_INVALID");
  const expectedMime = types[suffix as keyof typeof types];
  if (input.contentType !== expectedMime)
    throw new Error("JD_FILE_TYPE_INVALID");
  if (!Number.isSafeInteger(input.sizeBytes) ||
      input.sizeBytes < 1 || input.sizeBytes > maxBytes)
    throw new Error("JD_FILE_SIZE_INVALID");
  return { originalName, contentType: expectedMime };
}

export async function initiateOwnRecruiterJdUpload(context: RequestContext, raw: unknown) {
  const input = z.strictObject({
    collegeId: uuid, originalName: z.string().min(1).max(255),
    contentType: z.string(), sizeBytes: z.number().int().positive(),
  }).parse(raw);
  const owner = await requireRecruiterStorageScope(context, input.collegeId);
  const verified = validateRecruiterJdFile(input);
  const grant = await createPrivateUploadGrant({
    ...owner, namespace: "placement-document",
    expectedSizeBytes: input.sizeBytes, maxSizeBytes: maxBytes,
    contentType: verified.contentType, originalName: verified.originalName,
  });
  return {
    objectKey: grant.objectKey,
    uploadUrl: grant.uploadUrl,
    requiredHeaders: grant.requiredHeaders,
    expiresAt: grant.expiresAt.toISOString(),
  };
}

export async function verifyOwnRecruiterJdObject(
  context: RequestContext, collegeId: string, rawObjectKey?: string,
) {
  const owner = await requireRecruiterStorageScope(context, collegeId);
  if (!rawObjectKey) return null;
  const objectKey = keySchema.parse(rawObjectKey);
  const proof = await readPrivateObjectAttestation(objectKey, owner);
  if (proof.sizeBytes > maxBytes ||
      !Object.values(types).some(mime => mime === proof.contentType))
    throw new Error("JD_FILE_TYPE_INVALID");
  return proof;
}

export async function readOwnRecruiterJd(
  context: RequestContext, collegeId: string, objectKey: string,
) {
  const proof = await verifyOwnRecruiterJdObject(context, collegeId, objectKey);
  if (!proof) throw new Error("JD_NOT_FOUND");
  const owner = await requireRecruiterStorageScope(context, collegeId);
  const grant = await createPrivateReadGrant({
    ...owner, objectKey: proof.objectKey,
  });
  return { readUrl: grant.readUrl, expiresAt: grant.expiresAt.toISOString() };
}
