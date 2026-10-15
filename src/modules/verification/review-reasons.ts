export const VERIFICATION_SEND_BACK_REASONS=[
 "Marksheet is missing or unreadable",
 "Submitted details do not match the document",
 "Identity document is missing or unclear",
 "Please upload a newer supporting document",
] as const;
export function verificationSendBackReason(preset:string,details:string):string {
 const reason=[preset.trim(),details.trim()].filter(Boolean).join(": ");
 if(reason.length<3||reason.length>500)throw Error("INVALID_VERIFICATION_REASON");
 return reason;
}
