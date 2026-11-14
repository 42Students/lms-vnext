import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const tpoCompanyTeamCompanyIdSchema=zUuid;
export const tpoCompanyTeamPostSchema=z.strictObject({
 body:z.string().trim().min(1).max(4000),
 idempotencyKey:zUuid,
});
/** Archived relationships keep history but never accept new messages. */
export function canPostToTpoCompanyTeam(status:string):boolean{
 return status==="ACTIVE";
}
