import {z} from "zod";
const id=z.string().uuid();
export const tpoTeamAskCreateSchema=z.strictObject({
 threadId:id,assigneeMembershipId:id,requestKey:id,
 title:z.string().trim().min(1).max(200),
 dueAt:z.string().datetime({offset:true}).nullable(),
});
export const tpoTeamAskActionSchema=z.strictObject({
 threadId:id,askId:id,action:z.enum(["DONE","CANCEL"]),
 expectedStatus:z.literal("OPEN"),
 note:z.string().trim().max(2000).optional(),
});
export function tpoTeamAskState(status:"OPEN"|"DONE"|"CANCELLED",dueAt:Date|null,now:Date){
 return status==="OPEN"&&dueAt&&dueAt.getTime()<now.getTime()?"OVERDUE":status;
}
export function tpoTeamAskCanTransition(action:"DONE"|"CANCEL",actorId:string,askerId:string,assigneeId:string){
 return action==="DONE"?actorId===assigneeId:actorId===askerId;
}
