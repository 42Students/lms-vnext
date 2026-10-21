import {publicWorkEmailIssue,publicWorkEmailIssueCopy} from "@/modules/placements/public-work-email-policy";
import {publicRecruiterWorkEmailSchema} from "@/modules/placements/public-college-join-model";
/** REC-calendar-messages-profile-R04/39/45: identify recoverable public join errors
 * without leaking email existence, verifying the user client-side, or claiming success. */
export function validatePublicJoinClient(input:{
 email:string;name:string;phone:string;companyName:string;
 stage?:"SEND"|"JOIN";
 companyDomain:string;scope:"COLLEGE"|"COMPANY";
}):string|null{
 const email=input.email.trim().toLowerCase();
 if(!email)return "Enter your work email";
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return "Enter a valid email";
 const emailIssue=publicWorkEmailIssue(email);
 if(emailIssue)return publicWorkEmailIssueCopy(emailIssue);
 if(!publicRecruiterWorkEmailSchema.safeParse(email).success)
  return "Enter a valid company work email address.";
 // The server validates every verified domain belonging to the linked company.
 // The primary display domain alone cannot reject an approved secondary domain.
 if(input.stage!=="SEND"&&!input.name.trim())return "Enter your name";
 if(input.scope==="COLLEGE"&&input.stage!=="SEND"&&input.companyName.trim().length<2)
  return "Enter your company name";
 const digits=input.phone.replace(/[^0-9]/g,"");
 if(input.stage!=="SEND"&&input.phone.trim()&&(!/^[+0-9() .-]+$/.test(input.phone)||!(digits.length===10||(digits.length===12&&digits.startsWith("91")))))return "Enter a valid 10-digit mobile number, or leave it blank.";
 return null;
}
export function publicJoinErrorCopy(stage:"SEND"|"JOIN",status:number,code:string,
 scope:"COLLEGE"|"COMPANY",domain:string):string{
 if(status===503||code==="SERVICE_NOT_READY")
  return "Joining is temporarily unavailable at this college. Ask the placement cell to enable the service.";
 if(status===429)return "Too many attempts. Try again later.";
 if(status===403||code==="ACCESS_REMOVED")return "Your invitation or college access has ended. Ask the placement cell for a new link.";
 if(stage==="SEND"){
  if(status===400&&scope==="COMPANY"&&domain)return "Use your "+domain+" email address for this link.";
  return "We could not send a code. Check the email and invitation or try again.";
 }
 return status===400?"That code may be incorrect or expired. Request a new code and try again.":
  "We could not complete joining. Please try again.";
}
