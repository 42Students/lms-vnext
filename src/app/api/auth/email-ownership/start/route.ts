import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getCurrentDeviceSession} from "@/auth/current-session";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedAuthJson,AuthRequestBodyTooLarge} from "@/lib/request-body";
import {privateAuthJson,privateAuthResponse} from "@/modules/auth/private-response";
import {ownEmailOwnershipScope} from "@/modules/identity/own-email-ownership-scope";
import {issueOwnEmailOwnershipLink} from "@/modules/identity/own-email-ownership-runtime";
import { route } from "@/security/route";

export const runtime="nodejs";
const schema=z.strictObject({applicationId:z.string().uuid().optional()});

/** A same-origin, real-device-only sender. Browser cannot select user,
 * membership, college, recipient, template or redirect URL. */
async function handlePOST(request:Request){
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
  const scope=ownEmailOwnershipScope(context,device,parsed.data.applicationId);
  const result=await issueOwnEmailOwnershipLink(scope,request.headers.get("origin")!);
  return privateAuthJson({challengeId:result.id,expiresAt:result.expiresAt,
   kind:"EMAIL_OWNERSHIP_LINK",sessionCreated:false});
 }catch(error){
  const code=error instanceof Error?error.message:"";
  if(code==="EMAIL_LINK_CONTEXT_DENIED"||code==="EMAIL_LINK_SCOPE_INVALID")
   return privateAuthJson({error:"FORBIDDEN"},{status:403});
  if(code==="EMAIL_LINK_RATE_LIMIT")
   return privateAuthJson({error:"TOO_MANY_REQUESTS"},{status:429,headers:{"Retry-After":"60"}});
  if(["EMAIL_LINK_DELIVERY_DISABLED","EMAIL_LINK_DELIVERY_FAILED",
       "EMAIL_LINK_PROVIDER_NOT_CONFIGURED"].includes(code))
   return privateAuthJson({error:"PROOF_DELIVERY_UNAVAILABLE"},{status:503});
  return privateAuthResponse(apiErrorResponse(error));
 }
}
export const POST = route(
  { auth: "public", publicReason: "Sign-in, recovery and session endpoints run before or independently of a session; each handler enforces its own challenge, device or session-state checks.", csrf: false, csrfExemptReason: "The handler applies its own origin and challenge checks, unchanged by this wrapper.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
