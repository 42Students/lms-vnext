/** No final-delivery evidence may be accepted from an upload that merely
 * has a client-reported READY flag. The object generation, independent
 * malware-scan attestation, verified content type and size are authoritative.
 * This check complements the PostgreSQL READY constraint and protects legacy
 * rows imported before that constraint was installed.
 */
export type ProjectFinalFileEvidence={
 status:string;scanStatus:string;objectGeneration:string|null;
 scanAttestedBy:string|null;scanAttestedAt:Date|null;
 verifiedContentType:string|null;verifiedSizeBytes:number|null;
 completedAt:Date|null;deletedAt:Date|null;
};
export function projectFinalFileEvidenceIsVerified<T extends ProjectFinalFileEvidence>(
 file:T|null|undefined,
):file is T{
 return Boolean(file && file.status==="READY" && file.scanStatus==="CLEAN" &&
   !file.deletedAt && file.scanAttestedBy?.trim() &&
   file.scanAttestedAt instanceof Date&&Number.isFinite(file.scanAttestedAt.getTime()) &&
   file.completedAt instanceof Date&&Number.isFinite(file.completedAt.getTime()) &&
   file.objectGeneration&&/^[0-9]+$/.test(file.objectGeneration) &&
   file.verifiedContentType?.trim()&&file.verifiedContentType.includes("/") &&
   Number.isSafeInteger(file.verifiedSizeBytes)&&file.verifiedSizeBytes!>0);
}
