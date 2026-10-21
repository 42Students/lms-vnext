export const JOIN_ERROR_COPY={
 EMAIL_NO_MX:"This email domain has no mail server. Check the address.",
 EMAIL_MX_UNAVAILABLE:"We couldn\x27t verify this email domain right now. Please try again.",
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
 ACCESS_REMOVED:"The placement cell removed your access. Please contact them.",
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
