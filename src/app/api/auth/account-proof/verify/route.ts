import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getCurrentDeviceSession} from "@/auth/current-session";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedAuthJson,AuthRequestBodyTooLarge} from "@/modules/auth/bounded-json";
import {privateAuthJson,privateAuthResponse} from "@/modules/auth/private-response";
import {ownAccountProofScope} from "@/modules/identity/own-account-proof-authorization";
import {redeemScopedAccountProof} from "@/modules/identity/scoped-account-verification-service";

export const runtime="nodejs";
const schema=z.strictObject({
 challengeId:z.string().uuid(),
 code:z.string().regex(/^\d{6}$/),
});

/** Verification proves own scoped role ownership only. It never logs in,
 * grants a role, mints tokens/cookies or changes active college selection. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return privateAuthJson({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const device=await getCurrentDeviceSession();
  let raw:unknown;
  try{raw=await readBoundedAuthJson(request,2048);}
  catch(error){
   return privateAuthJson({
    error:error instanceof AuthRequestBodyTooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST",
   },{status:error instanceof AuthRequestBodyTooLarge?413:400});
  }
  const parsed=schema.safeParse(raw);
  if(!parsed.success)return privateAuthJson({error:"INVALID_REQUEST"},{status:400});
  // Channel is selected from the stored attempt, never client authority.
  const scope=ownAccountProofScope(context,device,"EMAIL");
  const verified=await redeemScopedAccountProof({
   ...parsed.data,
   userId:scope.userId,membershipId:scope.membershipId,role:scope.role,
  });
  return privateAuthJson({verified,kind:"SCOPED_ACCOUNT_PROOF",sessionCreated:false});
 }catch(error){
  if(error instanceof Error&&error.message==="ROLE_PROOF_CONTEXT_DENIED")
   return privateAuthJson({error:"FORBIDDEN"},{status:403});
  return privateAuthResponse(apiErrorResponse(error));
 }
}
