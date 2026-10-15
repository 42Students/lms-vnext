import {z} from "zod";
export const restoreProjectInstanceInputSchema=z.object({
  expectedUpdatedAt:z.iso.datetime({offset:true}),
}).strict();
/** Never restore an unrecognized historical status from audit metadata. */
export function restoredProjectStatus(previous:unknown):"PLANNED"|"ACTIVE"|"COMPLETED" {
  return previous==="ACTIVE"||previous==="COMPLETED"?previous:"PLANNED";
}
