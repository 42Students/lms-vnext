import {z} from "zod";
export const tpoCompanyTeamCompanyIdSchema=z.string().uuid();
export const tpoCompanyTeamPostSchema=z.strictObject({
 body:z.string().trim().min(1).max(4000),
 idempotencyKey:z.string().uuid(),
});
/** Archived relationships keep history but never accept new messages. */
export function canPostToTpoCompanyTeam(status:string):boolean{
 return status==="ACTIVE";
}
