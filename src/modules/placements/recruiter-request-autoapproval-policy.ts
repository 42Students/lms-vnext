/** Fail closed for accounts whose verification is pending. TPO-created
 * trusted relationships and explicit college settings are the sole shortcuts. */
export function recruiterAutoApprovalReason(input:{
 verificationPending:boolean;trustedCompany:boolean;trustedDomain:boolean;approvalRequired:boolean;
}):"TRUSTED_COMPANY"|"TRUSTED_DOMAIN"|"COLLEGE_APPROVAL_DISABLED"|null{
 if(input.verificationPending)return null;
 if(input.trustedCompany)return "TRUSTED_COMPANY";
 if(input.trustedDomain)return "TRUSTED_DOMAIN";
 if(!input.approvalRequired)return "COLLEGE_APPROVAL_DISABLED";
 return null;
}
