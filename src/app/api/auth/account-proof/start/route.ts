import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getCurrentDeviceSession} from "@/auth/current-session";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedAuthJson,AuthRequestBodyTooLarge} from "@/modules/auth/bounded-json";
import {privateAuthJson,privateAuthResponse} from "@/modules/auth/private-response";
import {ownAccountProofScope} from "@/modules/identity/own-account-proof-authorization";
import {issueOwnAccountProofWithProvider} from "@/modules/identity/own-account-proof-runtime";

export const runtime="nodejs";

const schema=z.strictObject({
 channel:z.enum(["EMAIL","PHONE"]),
 expectedRollNumber:z.string().trim().min(1).max(128).optional(),
});

/** Authenticated, own-active-role proof only: neither identifiers nor a role
 * can be submitted by the browser, even if it has other college memberships. */
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
  const input=schema.safeParse(raw);
  if(!input.success)return privateAuthJson({error:"INVALID_REQUEST"},{status:400});
  const scope=ownAccountProofScope(context,device,input.data.channel,
   input.data.expectedRollNumber);
  const issued=await issueOwnAccountProofWithProvider(scope);
  return privateAuthJson({challengeId:issued.challengeId,
    expiresAt:issued.expiresAt,kind:"SCOPED_ACCOUNT_PROOF",sessionCreated:false});
 }catch(error){
  const code=error instanceof Error?error.message:"";
  if(code==="ROLE_PROOF_CONTEXT_DENIED"||code==="ROLE_PROOF_SCOPE_INVALID")
   return privateAuthJson({error:"FORBIDDEN"},{status:403});
  if(code==="ROLE_PROOF_RATE_LIMIT")
   return privateAuthJson({error:"TOO_MANY_REQUESTS"},{status:429,
    headers:{"Retry-After":"60"}});
  if(["ROLE_PROOF_DELIVERY_DISABLED","ROLE_PROOF_DELIVERY_FAILED",
      "ROLE_PROOF_PROVIDER_NOT_CONFIGURED"].includes(code))
   return privateAuthJson({error:"PROOF_DELIVERY_UNAVAILABLE"},{status:503});
  return privateAuthResponse(apiErrorResponse(error));
 }
}
