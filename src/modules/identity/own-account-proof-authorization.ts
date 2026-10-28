import type {RequestContext} from "@/modules/identity/context";

type ProofRole="LEARNER"|"FACULTY";
type Channel="EMAIL"|"PHONE";

/** Pure policy boundary. Client input must never supply a user, membership,
 * college or role; derive all proof authority from the live HTTP session. */
export function ownAccountProofScope(
 context:RequestContext,
 device:{userId:string},
 channel:Channel,
 expectedRollNumber?:string,
):{
 userId:string;membershipId:string;role:ProofRole;
 channel:Channel;expectedRollNumber?:string;
}{
 const member=context.membership;
 if(context.user.platformStatus!=="ACTIVE"||
  !member||member.status!=="ACTIVE"||device.userId!==context.user.id||
  member.roles.length!==1||
  (member.roles[0]!=="LEARNER"&&member.roles[0]!=="FACULTY"))
  throw new Error("ROLE_PROOF_CONTEXT_DENIED");
 if(channel!=="EMAIL"&&channel!=="PHONE")
  throw new Error("ROLE_PROOF_CONTEXT_DENIED");
 if(expectedRollNumber!==undefined&&member.roles[0]!=="LEARNER")
  throw new Error("ROLE_PROOF_CONTEXT_DENIED");
 return {
  userId:context.user.id,membershipId:member.id,role:member.roles[0],
  channel,...(expectedRollNumber===undefined?{}:{expectedRollNumber}),
 };
}
