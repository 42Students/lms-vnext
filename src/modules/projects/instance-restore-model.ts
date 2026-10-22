import {z} from "zod";
/** The legacy Restore button carried only the workspace ID/selected college.
 * The vNext action URL carries that ID and the selected-college membership
 * still authorizes the restore. The request body adds a snapshot version to
 * reject a stale click; it MUST originate from a scoped deleted/archived row,
 * not be generated from the clock or trusted from a URL query parameter.
 */
export const restoreProjectInstanceInputSchema=z.object({
  expectedUpdatedAt:z.iso.datetime({offset:true}),
}).strict();
/** Build the CAS body from a scoped workspace row displayed to the admin. */
export function projectRestoreBodyFromSnapshot(row:{updatedAt:Date|string}){
 const instant=row.updatedAt instanceof Date?row.updatedAt:new Date(row.updatedAt);
 if(!Number.isFinite(instant.getTime()))throw new Error("INVALID_RESTORE_VERSION");
 return restoreProjectInstanceInputSchema.parse({expectedUpdatedAt:instant.toISOString()});
}
/** Never restore an unrecognized historical status from audit metadata. */
export function restoredProjectStatus(previous:unknown):"PLANNED"|"ACTIVE"|"COMPLETED" {
  return previous==="ACTIVE"||previous==="COMPLETED"?previous:"PLANNED";
}
