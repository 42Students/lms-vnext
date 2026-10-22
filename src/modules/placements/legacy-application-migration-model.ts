/** Import-only crosswalk for the old JobDetailContent apply request:
 * jobId + learnerId + resumeUrl. Live vNext self-apply is membership scoped
 * and must never trust learnerId from the browser.
 *
 * No legacy application/resume data was migrated at the vNext reset.
 * This model deliberately records NOT_IMPORTED rather than presenting a
 * historical resume URL as a verified signed private-file attachment.
 */
type LegacyApplyRecord={
 legacyJobId:number;legacyLearnerId:number;
 resumeUrl?:string|null;legacyRoleId?:number|null;
};
type AppliedIdentityMapping={
 jobId:string;learnerMembershipId:string;
 roleOptionId:string|null;
};
export type LegacyResumeDisposition=
 |{status:"NONE_PROVIDED";legacyUrlRetained:false}
 |{status:"NOT_IMPORTED";legacyUrlRetained:false;reason:"PRIVATE_STORAGE_ATTESTATION_REQUIRED"};

export function mapLegacyJobApplicationForMigration(
 raw:LegacyApplyRecord,mapped:AppliedIdentityMapping,
):{
 jobId:string;learnerMembershipId:string;roleOptionId:string|null;
 resume:LegacyResumeDisposition;legacySource:{jobId:number;learnerId:number};
}{
 const validPositive=(n:number)=>Number.isSafeInteger(n)&&n>0;
 const uuid=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
 if(!validPositive(raw.legacyJobId)||!validPositive(raw.legacyLearnerId)||
    !uuid(mapped.jobId)||!uuid(mapped.learnerMembershipId)||
    mapped.roleOptionId!==null&&!uuid(mapped.roleOptionId)||
    raw.legacyRoleId!=null&&!validPositive(raw.legacyRoleId)){
  throw new Error("LEGACY_APPLICATION_MAPPING_INVALID");
 }
 if(raw.legacyRoleId!=null&&!mapped.roleOptionId)
  throw new Error("LEGACY_APPLICATION_ROLE_MAPPING_REQUIRED");
 const hasResume=typeof raw.resumeUrl==="string"&&raw.resumeUrl.trim().length>0;
 // Never dereference a legacy URL, retain its query-string credentials or
 // label the link as an authenticated upload. A future import must create a
 // scoped private receipt with attested MIME/size before persisting a file.
 return {
  jobId:mapped.jobId,learnerMembershipId:mapped.learnerMembershipId,
  roleOptionId:mapped.roleOptionId,
  resume:hasResume?{
   status:"NOT_IMPORTED" as const,legacyUrlRetained:false as const,
   reason:"PRIVATE_STORAGE_ATTESTATION_REQUIRED" as const,
  }:{status:"NONE_PROVIDED" as const,legacyUrlRetained:false as const},
  legacySource:{jobId:raw.legacyJobId,learnerId:raw.legacyLearnerId},
 };
}
