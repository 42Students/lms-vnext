export const JOIN_ERROR_COPY={
 EMAIL_NO_MX:"This domain doesn't receive email. Check the spelling",
 EMAIL_INVALID:"Enter a valid company email address.",
 EMAIL_PERSONAL:"Use your company work email rather than a personal address.",
 EMAIL_DISPOSABLE:"Temporary email addresses cannot be used for recruitment.",
 EMAIL_ACADEMIC:"Use a company domain rather than an academic address.",
 EMAIL_IP_ADDRESS:"Use a registered company email domain, not an IP address.",
 EMAIL_MX_UNAVAILABLE:"We couldn't check the email domain right now. This does not mean your address is invalid. Retry sending the code.",
 PHONE_STORAGE_NOT_READY:"Mobile contact storage is not ready. Remove the optional mobile number or ask the placement cell to enable it.",
 INVALID_MOBILE:"Enter a valid 10-digit mobile number, or leave it blank.",
 WRONG_CODE:"That code isn't right. Check the latest email from us.",
 CODE_EXPIRED:"That code has expired. Send a new one.",
 CODE_LOCKED:"Too many wrong codes. Send a new one.",
 CODE_REQUIRED:"Enter the 6-digit code",
 TOO_MANY_CODES:"Too many codes. Please try again in an hour.",
 RATE_LIMITED:"Too many tries from this network. Please try again in an hour.",
 OTHER_COMPANY_EMAIL:"Use your company work email address.",
 COMPANY_EXISTS:"That company already exists. Ask the placement cell to help you join.",
 COMPANY_REQUIRED:"Add your company's name",
 ACCESS_REMOVED:"Your access was removed by the placement cell. Contact the placement cell to request a review or appeal.",
 ACCOUNT_UNAVAILABLE:"This account can't be used. Please contact the placement cell.",
 SERVICE_NOT_READY:"Recruiter verification is temporarily unavailable. Ask the placement cell to check the email service and network verification settings.",
 COULD_NOT_JOIN:"Something went wrong. Please try again.",
 COULD_NOT_SEND_CODE:"We couldn't send the code. Please try again.",
} as const;
export type JoinErrorCode=keyof typeof JOIN_ERROR_COPY;
export function joinErrorMessage(code:unknown,defaultKind:"JOIN"|"SEND"="JOIN"){
 if(typeof code==="string"&&Object.prototype.hasOwnProperty.call(JOIN_ERROR_COPY,code))
  return JOIN_ERROR_COPY[code as JoinErrorCode];
 return defaultKind==="JOIN"?JOIN_ERROR_COPY.COULD_NOT_JOIN:JOIN_ERROR_COPY.COULD_NOT_SEND_CODE;
}


/** Field-level hints do not expose recruiter account or company existence. */
export function joinFieldError(code:unknown):{
 field:"email"|"company"|null;message:string;retryable:boolean;
}{
 const value=typeof code==="string"?code:"";
 if(value==="EMAIL_MX_UNAVAILABLE")return {
  field:"email",message:JOIN_ERROR_COPY.EMAIL_MX_UNAVAILABLE,retryable:true,
 };
 if(value==="EMAIL_NO_MX")return {
  field:"email",message:JOIN_ERROR_COPY.EMAIL_NO_MX,retryable:false,
 };
 if(value==="OTHER_COMPANY_EMAIL"||value==="COMPANY_EMAIL_REQUIRED")
  return {field:"email",message:value==="COMPANY_EMAIL_REQUIRED"
   ?"Enter your company work email address.":JOIN_ERROR_COPY.OTHER_COMPANY_EMAIL,
   retryable:false};
 if(value==="COMPANY_REQUIRED")return {field:"company",
  message:JOIN_ERROR_COPY.COMPANY_REQUIRED,retryable:false};
 return {field:null,message:joinErrorMessage(code),retryable:false};
}

/** Map the six legacy domain diagnoses to safe, differentiated help. */
export function legacyJoinDomainDecisionMessage(status:string):{message:string;retryable:boolean}{
 const mapping:Record<string,keyof typeof JOIN_ERROR_COPY>={
  INVALID:"EMAIL_INVALID",PERSONAL:"EMAIL_PERSONAL",DISPOSABLE:"EMAIL_DISPOSABLE",
  ACADEMIC:"EMAIL_ACADEMIC",IP_ADDRESS:"EMAIL_IP_ADDRESS",NO_MAIL:"EMAIL_NO_MX",
 };
 const key=mapping[status.toUpperCase()];
 return key?{message:JOIN_ERROR_COPY[key],retryable:false}:
  {message:JOIN_ERROR_COPY.EMAIL_MX_UNAVAILABLE,retryable:true};
}
