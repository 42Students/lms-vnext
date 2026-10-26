import { and, asc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  colleges,
  organizations,
  placementCompanies,
  placementCompanyDomains,
  placementCompanyRelationships,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  users,
} from "@/db/schema";
import {
  hasActiveRecruiter,
  type RecruiterGrant,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import {getPrivateR2Config} from "@/modules/storage/r2-config";
import {headObject,presignUrl} from "@/modules/storage/s3-client";

/** A legacy company logo URL was public. Private vNext logo keys only
 * become readable through a short-lived, company-scoped signed GET after the
 * exact persisted grant and storage metadata have been checked.
 */
async function recruiterCompanyLogoUrl(company:{
 id:string;logoObjectPath:string|null;logoPublicUrl:string|null;
}):Promise<string|null>{
 const publicUrl=company.logoPublicUrl;
 const publicLogo=publicUrl&&/^https:\/\/[^\s]+$/i.test(publicUrl)?publicUrl:null;
 const key=company.logoObjectPath;
 if(!key||!key.startsWith("companies/"+company.id+"/"))return publicLogo;
 try{
  const config=getPrivateR2Config();
  const head=await headObject(config,key);
  if(!head||head.sizeBytes<1||head.sizeBytes>2*1024*1024||
     !["image/png","image/jpeg","image/webp"].includes(head.contentType)||
     head.metadata["company-id"]!==company.id||
     head.metadata["asset-type"]!=="company-logo")
    return publicLogo;
  return presignUrl(config,{method:"GET",key,expiresSeconds:120});
 }catch{
  // An unconfigured private bucket or missing logo never blocks the profile.
  return publicLogo;
 }
}

export type RecruiterCompanyScope =
  | { status: "NO_ACCESS"; choices: readonly RecruiterGrant[] }
  | { status: "CHOOSE_COLLEGE"; choices: readonly RecruiterGrant[] }
  | { status: "READY"; grant: RecruiterGrant; choices: readonly RecruiterGrant[] };

/**
 * Recruiter sessions must never guess a college when more than one grant is active.
 * One grant may be selected implicitly because there is no ambiguity.
 */
export function resolveRecruiterCompanyScope(
  context: RequestContext,
  requestedCollegeId?: string | null,
): RecruiterCompanyScope {
  if (!hasActiveRecruiter(context) || !context.recruiter ||
      context.recruiter.userId !== context.user.id) {
    throw new AuthorizationError("placements.recruiter.read");
  }
  const choices = context.recruiter.grants;
  if (choices.length === 0) return { status: "NO_ACCESS", choices };
  if (requestedCollegeId) {
    const grant = choices.find((item) => item.collegeId === requestedCollegeId);
    if (!grant) throw new AuthorizationError("placements.recruiter.read");
    return { status: "READY", grant, choices };
  }
  if (choices.length === 1) return { status: "READY", grant: choices[0]!, choices };
  return { status: "CHOOSE_COLLEGE", choices };
}

export async function getRecruiterCompanyTeam(
  context: RequestContext,
  requestedCollegeId?: string | null,
  includeTeam = true,
) {
  const scope = resolveRecruiterCompanyScope(context, requestedCollegeId);
  if (scope.status !== "READY") return scope;
  const recruiter = context.recruiter!;
  const db = getDb();
  const [company] = await db
    .select({
      id: placementCompanies.id,
      name: placementCompanies.name,
      websiteUrl: placementCompanies.websiteUrl,
      industry: placementCompanies.industry,
      verifiedAt: placementCompanies.verifiedAt,
      primaryDomain: placementCompanies.primaryDomain,
      logoObjectPath: placementCompanies.logoObjectPath,
      logoPublicUrl: placementCompanies.logoPublicUrl,
      relationshipId: placementCompanyRelationships.id,
      trusted: placementCompanyRelationships.isTrusted,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      colleges,
      and(eq(colleges.id,placementCompanyRelationships.collegeId),
        eq(colleges.status,"ACTIVE")),
    )
    .innerJoin(organizations,and(
      eq(organizations.id,colleges.organizationId),
      eq(organizations.status,"ACTIVE"),
    ))
    .innerJoin(
      placementCompanies,
      eq(placementCompanies.id, placementCompanyRelationships.companyId),
    )
    // A session grant may remain cached after revocation. The acting
    // recruiter's persisted profile and relationship must still be ACTIVE.
    .innerJoin(placementRecruiterProfiles,and(
      eq(placementRecruiterProfiles.userId,context.user.id),
      eq(placementRecruiterProfiles.companyId,placementCompanies.id),
      eq(placementRecruiterProfiles.status,"ACTIVE"),
    ))
    .innerJoin(placementRecruiterCollegeGrants,and(
      // A still-active sibling grant must never resurrect the exact selected
      // session grant after it is revoked.
      eq(placementRecruiterCollegeGrants.id,scope.grant.id),
      eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
      eq(placementRecruiterCollegeGrants.companyRelationshipId,placementCompanyRelationships.id),
      eq(placementRecruiterCollegeGrants.status,"ACTIVE"),
      eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
      gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
    ))
    .innerJoin(users,and(
      eq(users.id,context.user.id),
      eq(users.platformStatus,"ACTIVE"),
    ))
    .where(and(
      eq(placementCompanyRelationships.id, scope.grant.companyRelationshipId),
      eq(placementCompanyRelationships.collegeId, scope.grant.collegeId),
      eq(placementCompanyRelationships.companyId, recruiter.companyId),
      eq(placementCompanyRelationships.status, "ACTIVE"),
      eq(placementCompanies.status, "ACTIVE"),
    ))
    .limit(1);

  // Missing persisted active grant or relationship is revoked access, never
  // a silently guessed company. A NULL expiry is never a live grant.
  if (!company) throw new AuthorizationError("placements.recruiter.read");

  const [logoUrl,domainRows]=await Promise.all([
   recruiterCompanyLogoUrl(company),
   db.select({domain:placementCompanyDomains.domain}).from(placementCompanyDomains)
    .where(eq(placementCompanyDomains.companyId,company.id))
    .orderBy(asc(placementCompanyDomains.domain)).limit(25),
  ]);
  // Company overview remains available even if the Team roster is slow or
  // unavailable; query colleagues only on the explicitly selected Team tab.
  const team = includeTeam ? await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      email: users.email,
      title: placementRecruiterProfiles.title,
      capabilities: placementRecruiterCollegeGrants.capabilities,
    })
    .from(placementRecruiterCollegeGrants)
    .innerJoin(
      placementRecruiterProfiles,
      eq(placementRecruiterProfiles.userId, placementRecruiterCollegeGrants.recruiterUserId),
    )
    .innerJoin(users, eq(users.id, placementRecruiterCollegeGrants.recruiterUserId))
    .where(and(
      eq(placementRecruiterCollegeGrants.companyRelationshipId, company.relationshipId),
      eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
      // HR-TEAM-RECIPIENT-45: expired/unverified colleagues are not active
      // placement-cell contacts even if their profile is still ACTIVE.
      eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED"),
      gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`),
      eq(placementRecruiterProfiles.companyId, company.id),
      eq(placementRecruiterProfiles.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .orderBy(asc(users.displayName), asc(users.email)) : [];

  // Keep imported source object keys private; no raw key is serialized into
  // the recruiter page. The fallback initial is always safe to render.
  const {logoObjectPath:_logoObjectPath,...safeCompany}=company;
  void _logoObjectPath;
  const orderedTeam=team.map(member=>({
   ...member,isYou:member.userId===context.user.id,
  })).sort((a,b)=>{
   if(a.isYou!==b.isYou)return a.isYou?-1:1;
   const first=(value:string|null)=>value?.trim().split(/\s+/)[0]??"";
   return first(a.displayName).localeCompare(first(b.displayName),"en-IN",{sensitivity:"base",numeric:true})||
    (a.displayName??"").localeCompare(b.displayName??"","en-IN",{sensitivity:"base",numeric:true})||
    (a.email??"").localeCompare(b.email??"","en-IN",{sensitivity:"base"})||
    a.userId.localeCompare(b.userId);
  });
  return {
    status: "READY" as const,
    grant: scope.grant,
    choices: scope.choices,
    company:{...safeCompany,logoUrl,
     domains:[...new Set([
      ...domainRows.map(row=>row.domain),
      ...(company.primaryDomain?[company.primaryDomain]:[]),
     ])],
     logoInitial:company.name.trim().slice(0,1).toUpperCase()||"C"},
    team: orderedTeam,
  };
}
