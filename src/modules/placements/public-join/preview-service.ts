import "server-only";
import {createHash} from "node:crypto";
import {and,eq,isNull,gt} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,organizations} from "@/db/schema";
import {publicJoinLinks} from "./staged-schema";
import {publicJoinTablesReady} from "./readiness";
import {publicJoinPreviewForDisplay,type PublicJoinPreview} from "./preview-model";
import {publicCollegeJoinTokenSchema} from "../public-college-join-model";

/** Never log tokens, attempt queries before registration, or expose stored ids. */
export async function getPublicJoinPreview(token:string,scope:"COLLEGE"|"COMPANY"):Promise<PublicJoinPreview>{
 if(!publicCollegeJoinTokenSchema.safeParse(token).success)return {kind:"UNAVAILABLE"};
 if(!await publicJoinTablesReady())return {kind:"UNAVAILABLE"};
 const digest=createHash("sha256").update(token).digest("hex");
 const now=new Date();
 const [row]=await getDb().select({
  scope:publicJoinLinks.scope,expiresAt:publicJoinLinks.expiresAt,
  name:colleges.name,domain:publicJoinLinks.companyDomain,
 }).from(publicJoinLinks)
  .innerJoin(colleges,eq(colleges.id,publicJoinLinks.collegeId))
  .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
  .where(and(eq(publicJoinLinks.tokenHash,digest),eq(publicJoinLinks.scope,scope),
    isNull(publicJoinLinks.revokedAt),gt(publicJoinLinks.expiresAt,now),
    eq(colleges.status,"ACTIVE"),eq(organizations.status,"ACTIVE"))).limit(1);
 return publicJoinPreviewForDisplay({
  token,expectedScope:scope,persistedScope:row?.scope==="COLLEGE"||row?.scope==="COMPANY"?row.scope:null,
  validUntilMs:row?.expiresAt.getTime()??null,nowMs:now.getTime(),
  collegeActive:!!row,collegeName:row?.name??null,companyDomain:row?.domain??null,revoked:!row,
 });
}
