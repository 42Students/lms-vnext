import {z} from "zod";
export function tpoTeamCanEdit(createdAt:Date,now:Date){
 const age=now.getTime()-createdAt.getTime();
 return age>=0&&age<=15*60*1000;
}
export const teamMessageDigestSchema=z.string().regex(/^[a-f0-9]{64}$/);
