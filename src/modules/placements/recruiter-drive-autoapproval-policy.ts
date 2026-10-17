/** REC-home-drives-33: trusted domain is a college policy, never a client-supplied flag.
 * Do not trust substring matches (evil-example.com is not example.com), or
 * an address at a domain not registered to the employer itself.
 */
export function trustedRecruiterDomain(recruiterEmail:string|null,companyDomain:string|null,
  trustedDomains:readonly string[]):boolean{
 if(!recruiterEmail||!companyDomain)return false;
 const email=recruiterEmail.trim().toLowerCase();
 const at=email.lastIndexOf("@");
 if(at<1||at!==email.indexOf("@"))return false;
 const domain=email.slice(at+1);
 const company=companyDomain.trim().toLowerCase();
 return domain===company && trustedDomains.some(candidate=>candidate.trim().toLowerCase()===domain);
}
export function recruiterDriveApprovalPolicy(input:{
 approvalRequired:boolean;grantVerified:boolean;
 recruiterEmail:string|null;companyDomain:string|null;
 trustedDomains:readonly string[];relationshipTrusted:boolean;
}):{autoApprove:boolean;reason:"APPROVAL_OFF"|"TRUSTED_DOMAIN"|"REVIEW_REQUIRED"}{
 if(!input.grantVerified)return {autoApprove:false,reason:"REVIEW_REQUIRED"};
 if(!input.approvalRequired)return {autoApprove:true,reason:"APPROVAL_OFF"};
 if(input.relationshipTrusted&&trustedRecruiterDomain(input.recruiterEmail,
     input.companyDomain,[input.companyDomain??""])){
  return {autoApprove:true,reason:"TRUSTED_DOMAIN"};
 }
 if(trustedRecruiterDomain(input.recruiterEmail,input.companyDomain,input.trustedDomains))
  return {autoApprove:true,reason:"TRUSTED_DOMAIN"};
 return {autoApprove:false,reason:"REVIEW_REQUIRED"};
}
