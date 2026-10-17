import {z} from "zod";

/** Public JSON boundary; a handover never implicitly grants or revokes roles. */
export const tpoTeamHandoverSchema=z.strictObject({
 sourceMembershipId:z.string().uuid(),targetMembershipId:z.string().uuid(),
}).refine(input=>input.sourceMembershipId!==input.targetMembershipId,{
 path:["targetMembershipId"],message:"Choose a different team member to take over",
});

export function mayHandoverOwnTeamWork(input:{
 actorMembershipId:string;sourceMembershipId:string;targetMembershipId:string;
 sourceActive:boolean;targetActive:boolean;
}):boolean{
 return input.actorMembershipId!==input.sourceMembershipId &&
  input.sourceMembershipId!==input.targetMembershipId &&
  input.sourceActive && input.targetActive;
}
