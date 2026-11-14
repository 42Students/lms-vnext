import {z} from "zod";

import { zUuid } from "@/lib/schema-primitives";
/** The original 0134 requires a due date; registered 0136 permits a
 * null/omitted deadline while retaining college-scoped unique assignments. */
const uuid=zUuid;
export const tpoPrepAssignmentInputSchema=z.strictObject({
 offeringId:uuid,
 dueAt:z.iso.datetime({offset:true}).nullable().optional(),
 membershipIds:z.array(uuid).min(1).max(100),
}).refine(data=>new Set(data.membershipIds).size===data.membershipIds.length,
 {message:"Select each student only once",path:["membershipIds"]});
export type TpoPrepAssignmentInput=z.infer<typeof tpoPrepAssignmentInputSchema>;
