import type {VerificationSection} from "@/modules/profile-verification/domain";

/** Learner-facing copy follows the legacy Education / Identity decision wording. */
export function verificationDecisionNotice(input:{
 section:VerificationSection;action:"VERIFIED"|"SENT_BACK";
 reviewerName:string|null;reason:string|null;
}){
 const section=input.section==="EDUCATION"?"education":"identity";
 if(input.action==="VERIFIED")return {
  title:`Your ${section} is verified`,
  body:`Verified by ${input.reviewerName?.trim()||"the placement cell"}. Companies and the placement cell now see it as verified.`,
 };
 const reason=input.reason?.trim()||"Your submitted details need a change.";
 return {title:`Your ${section} needs a change`,
  body:`${reason} Fix it on your profile and send it again.`};
}
