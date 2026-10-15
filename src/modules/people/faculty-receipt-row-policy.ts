/** Existing verified receipt references are managed elsewhere.
 * Removal here would orphan a private document without a revocation workflow. */
export function facultyProfileRecordHasManagedDocument(row:object):boolean {
 return Object.entries(row).some(([key,value])=>
  key.endsWith("DocumentId") && value!==null && value!==undefined && value!=="");
}
