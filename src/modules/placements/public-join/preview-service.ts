import "server-only";
import {createHash} from "node:crypto";
import {and,eq,isNull,gt} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,organizations,placementCompanies} from "@/db/schema";
import {placementPublicJoinLinks as publicJoinLinks} from "@/db/schema";
import {publicJoinTablesReady} from "./readiness";
import {publicJoinPreviewForDisplay,type PublicJoinPreview} from "./preview-model";
import {publicCollegeJoinTokenSchema} from "../public-college-join-model";

/** Legacy links without an expiry cannot safely be written into the vNext
 * NOT NULL expiresAt schema as an arbitrary far-future date. On migration,
 * record them for administrator rotation and issue new finite-lived signed
 * tokens with out-of-band delivery. Until a valid replacement is enabled,
 * previews stay unavailable; legacy hashes are never auto-upgraded to a
 * permanent link and expiry checks are never bypassed. */
export const legacyPublicJoinLinkMigrationPolicy = {
 previousExpiry: "UNBOUNDED",
 action: "ADMIN_ROTATION_REQUIRED",
 importedLinkMayAuthorizeJoin: false,
 replacementNeedsFiniteExpiry: true,
 revokeOrRetireOriginalAfterRotation: true,
} as const;

/** Never log tokens, attempt queries before registration, or expose stored ids. */
export async function getPublicJoinPreview(token:string,scope:"COLLEGE"|"COMPANY"):Promise<PublicJoinPreview>{
 if(!publicCollegeJoinTokenSchema.safeParse(token).success)return {kind:"UNAVAILABLE"};
 if(!await publicJoinTablesReady())return {kind:"UNAVAILABLE"};
 const digest=createHash("sha256").update(token).digest("hex");
 const now=new Date();
 const [row]=await getDb().select({
  scope:publicJoinLinks.scope,expiresAt:publicJoinLinks.expiresAt,
  name:colleges.name,domain:publicJoinLinks.companyDomain,
   companyName:placementCompanies.name,
 }).from(publicJoinLinks)
  .innerJoin(colleges,eq(colleges.id,publicJoinLinks.collegeId))
  .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
   .leftJoin(placementCompanies,eq(placementCompanies.id,publicJoinLinks.companyId))
  .where(and(eq(publicJoinLinks.tokenHash,digest),eq(publicJoinLinks.scope,scope),
    isNull(publicJoinLinks.revokedAt),eq(publicJoinLinks.enabled,true),gt(publicJoinLinks.expiresAt,now),
    eq(colleges.status,"ACTIVE"),eq(organizations.status,"ACTIVE"))).limit(1);
 return publicJoinPreviewForDisplay({
  token,expectedScope:scope,persistedScope:row?.scope==="COLLEGE"||row?.scope==="COMPANY"?row.scope:null,
  validUntilMs:row?.expiresAt.getTime()??null,nowMs:now.getTime(),
  collegeActive:!!row,collegeName:row?.name??null,companyDomain:row?.domain??null,
   companyName:row?.companyName??null,revoked:!row,
 });
}
