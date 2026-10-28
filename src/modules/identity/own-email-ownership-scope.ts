import type {RequestContext} from "@/modules/identity/context";
import type {EmailLinkScope} from "@/modules/identity/email-link-verification-service";

/** Proof targets only the live session's selected active college membership.
 * A client-supplied applicationId is a lookup key, not authorization: the
 * service rechecks application ownership and tenant under row locks. */
export function ownEmailOwnershipScope(
 context:RequestContext,device:{userId:string},applicationId?:string,
):EmailLinkScope{
 const m=context.membership;
 if(context.user.platformStatus!=="ACTIVE"||device.userId!==context.user.id||
   !m||m.status!=="ACTIVE"||m.roles.length===0||
   (applicationId!==undefined&&!m.roles.includes("LEARNER")))
  throw new Error("EMAIL_LINK_CONTEXT_DENIED");
 return {
  userId:context.user.id,
  collegeId:m.collegeId,
  membershipId:m.id,
  ...(applicationId?{applicationId}:{}),
 };
}
