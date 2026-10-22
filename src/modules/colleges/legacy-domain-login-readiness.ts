import {z} from "zod";

/** Login-domain launch readiness is not operational setup readiness. The
 * policy MUST come from the resolver that serves actual logins. Branding,
 * academic roster and placement setup never block a configured login domain.
 */
export type LegacyDomainLoginFacts={
 requireVerifiedDomains:boolean;
 domainTotal:number|null;domainVerified:number|null;domainPrimary:number|null;
 verifiedPrimaryDomains:number|null;
 hasLogo:boolean|null;departments:number|null;
 facultyMemberships:number|null;enrolledLearners:number|null;
};

export function evaluateLegacyDomainLoginReadiness(f:LegacyDomainLoginFacts){
 const blockers:string[]=[],warnings:string[]=[],recommendedActions:string[]=[];
 const valid=(n:number|null):n is number=>n!==null&&Number.isSafeInteger(n)&&n>=0;
 const known=valid(f.domainTotal)&&valid(f.domainVerified)&&valid(f.domainPrimary)&&
  valid(f.verifiedPrimaryDomains)&&f.domainVerified<=f.domainTotal&&
  f.domainPrimary<=f.domainTotal&&f.verifiedPrimaryDomains<=f.domainVerified&&
  f.verifiedPrimaryDomains<=f.domainPrimary;
 if(known){
  // These nullable facts have passed the complete validity predicate.
  const domainTotal=f.domainTotal ?? 0;
  const domainPrimary=f.domainPrimary ?? 0;
  const domainVerified=f.domainVerified ?? 0;
  const verifiedPrimaryDomains=f.verifiedPrimaryDomains ?? 0;
  if(domainTotal===0){
   blockers.push("NO_DOMAIN");
   recommendedActions.push("Add at least one domain under Superadmin → Tenant Domains.");
  }
  if(domainTotal>0&&domainPrimary===0){
   blockers.push("NO_PRIMARY_DOMAIN");
   recommendedActions.push("Mark exactly one domain as Primary for this college.");
  }
  if(domainPrimary>1){
   blockers.push("MULTIPLE_PRIMARY_DOMAINS");
   recommendedActions.push("Ensure only one domain is Primary (others must be non-primary).");
  }
  if(f.requireVerifiedDomains&&domainTotal>0&&verifiedPrimaryDomains===0){
   blockers.push("NO_VERIFIED_PRIMARY_DOMAIN");
   recommendedActions.push("Verify the Primary domain (TXT verification) — required before this address can serve real logins.");
  }else if(domainTotal>0&&verifiedPrimaryDomains===0&&domainVerified>0){
   warnings.push("PRIMARY_DOMAIN_NOT_VERIFIED");
   recommendedActions.push("Prefer verifying the Primary domain to avoid future verification breakages.");
  }else if(domainTotal>0&&domainVerified===0){
   warnings.push("NO_VERIFIED_DOMAIN");
   recommendedActions.push("Verify at least one domain to make switching + onboarding safer.");
  }
 }
 if(f.hasLogo===false){
  warnings.push("MISSING_LOGO");
  recommendedActions.push("Add a logo (college logo or branding logoUrl).");
 }
 if([f.departments,f.facultyMemberships,f.enrolledLearners].some(n=>n===0)){
  warnings.push("EMPTY_COLLEGE_NO_ACADEMIC_DATA");
  recommendedActions.push("Add departments, faculty, and students — this college is missing at least one.");
 }
 return {readyForDomainLogin:known?blockers.length===0:null,
  blockers,warnings,recommendedActions,
  meta:{requireVerifiedDomains:f.requireVerifiedDomains,
    domainTotal:f.domainTotal,domainVerified:f.domainVerified,
    domainPrimary:f.domainPrimary,verifiedPrimaryDomains:f.verifiedPrimaryDomains,
    hasLogo:f.hasLogo,departments:f.departments,
    facultyMemberships:f.facultyMemberships,enrolledLearners:f.enrolledLearners,
    domainFactsKnown:known},
 };
}


/** Validate adapter/readiness responses at the boundary, not only at compile
 * time. Null denotes unavailable DB evidence and may never render as READY.
 * This deliberately preserves the legacy error for malformed DTOs while
 * allowing the vNext unknown-source state. */
const legacyDomainReadinessResponse=z.strictObject({
 readyForDomainLogin:z.boolean().nullable(),
 blockers:z.array(z.string().trim().min(1).max(120)).max(64),
 warnings:z.array(z.string().trim().min(1).max(120)).max(64),
 recommendedActions:z.array(z.string().trim().min(1).max(500)).max(64),
 meta:z.strictObject({
   requireVerifiedDomains:z.boolean(),domainTotal:z.number().int().nonnegative().nullable(),
   domainVerified:z.number().int().nonnegative().nullable(),
   domainPrimary:z.number().int().nonnegative().nullable(),
   verifiedPrimaryDomains:z.number().int().nonnegative().nullable(),
   hasLogo:z.boolean().nullable(),departments:z.number().int().nonnegative().nullable(),
   facultyMemberships:z.number().int().nonnegative().nullable(),
   enrolledLearners:z.number().int().nonnegative().nullable(),
   domainFactsKnown:z.boolean(),
 }).optional(),
});
export function validateLegacyDomainLoginReadinessResponse(value:unknown){
 const result=legacyDomainReadinessResponse.safeParse(value);
 if(!result.success)throw new Error("Unexpected readiness response");
 // A potentially malformed upstream 'ready' with contradictory blockers must
 // fail closed, never replace the result with an inferred green verdict.
 if(result.data.readyForDomainLogin===true&&result.data.blockers.length)
   throw new Error("Unexpected readiness response");
 return result.data;
}
