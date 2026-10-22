/** New private-storage routes use migration 0080; the old DB06 receipt flag is obsolete. */
export function assignmentFilesRuntimeEnabled() {
  return Boolean(
    process.env["R2_ACCOUNT_ID"]?.trim() &&
    process.env["R2_ACCESS_KEY"]?.trim() &&
    process.env["R2_SECRET_KEY"]?.trim() &&
    process.env["R2_PRIVATE_BUCKET"]?.trim()
  );
}

/** Migration 0111 is registered; file uploads only require private storage. */
export function multipartAssignmentRuntimeEnabled() {
  return assignmentFilesRuntimeEnabled();
}

/**
 * Legacy folder=assignments maps to a scoped signed direct PUT, never a
 * public bucket write: file-upload POST -> upload receipt -> private signed
 * object PUT -> receipt attestation -> submission PUT. A later replacement or
 * deletion changes the submission's owned receipt links; the private object
 * remains inaccessible without membership and delivery authorization.
 *
 * Original legacy 50 MiB is the DIRECT upload limit. The same-origin
 * multipart fallback intentionally caps at 10 MiB to avoid buffering large
 * server bodies. Content type and extension are rechecked by the canonical
 * assignment-file-validation schema; private-storage scanning is authoritative.
 */
export const ASSIGNMENT_LEGACY_FILE_COMPATIBILITY={
 legacyFolder:"assignments",
 namespace:"assignment-submission",
 directUploadLimitBytes:50*1024*1024,
 proxyUploadLimitBytes:10*1024*1024,
 pdfMimeType:"application/pdf",
 pdfExtension:".pdf",
 presignRoute:"/api/courses/assignments/[assignmentId]/file-upload",
 receiptPurpose:"ASSIGNMENT_SUBMISSION",
 submitKind:"FILE",
 signedReadOnly:true,
} as const;

/** Contextual copy for PDF-only assignment resources. Ordinary learner
 * submission files preserve the approved wider document/image type policy.
 */
export function assignmentFileLegacyFailure(
 file:{name:string;type:string;size:number},pdfOnly=false,
):string|null {
 if(!Number.isSafeInteger(file.size)||file.size<=0)
  return "Choose a non-empty file.";
 if(file.size>ASSIGNMENT_LEGACY_FILE_COMPATIBILITY.directUploadLimitBytes)
  return "Choose a file up to 50 MB.";
 if(pdfOnly&&(
   file.type.toLowerCase()!=="application/pdf"||
   !file.name.toLowerCase().endsWith(".pdf")
  )) return "Only PDF files are allowed.";
 return null;
}
