import {z} from "zod";

import { zUuid } from "@/lib/schema-primitives";
/** Public JSON boundary; a handover never implicitly grants or revokes roles. */
export const tpoTeamHandoverSchema=z.strictObject({
 sourceMembershipId:zUuid,targetMembershipId:zUuid,
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
