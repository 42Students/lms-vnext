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

/** Exact TPO legacy reasons, separate from the College Admin shared selector. */
export const TPO_EDUCATION_SEND_BACK_REASONS=[
 "The marksheet is unclear or cropped",
 "The marks do not match the marksheet",
 "A marksheet is missing",
] as const;
export const TPO_IDENTITY_SEND_BACK_REASONS=[
 "The document does not match the number",
 "Wrong document uploaded",
 "The document is unclear or cropped",
] as const;
export function tpoVerificationSectionReasons(section:"EDUCATION"|"IDENTITY"):readonly string[]{
 return section==="EDUCATION"?TPO_EDUCATION_SEND_BACK_REASONS:TPO_IDENTITY_SEND_BACK_REASONS;
}
