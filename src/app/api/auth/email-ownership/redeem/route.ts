import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getCurrentDeviceSession} from "@/auth/current-session";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedAuthJson,AuthRequestBodyTooLarge} from "@/modules/auth/bounded-json";
import {privateAuthJson,privateAuthResponse} from "@/modules/auth/private-response";
import {ownEmailOwnershipScope} from "@/modules/identity/own-email-ownership-scope";
import {redeemOwnEmailOwnershipLink} from "@/modules/identity/own-email-ownership-runtime";

export const runtime="nodejs";
const schema=z.strictObject({token:z.string().regex(/^[a-zA-Z0-9_-]{43}$/)});

/** A token confirms contact ownership only: it cannot mint login sessions,
 * change membership/role permissions, or approve a placement application. */
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
  const scope=ownEmailOwnershipScope(context,device);
  const verified=await redeemOwnEmailOwnershipLink(parsed.data.token,scope);
  return privateAuthJson({verified,kind:"EMAIL_OWNERSHIP_LINK",sessionCreated:false});
 }catch(error){
  if(error instanceof Error&&error.message==="EMAIL_LINK_CONTEXT_DENIED")
   return privateAuthJson({error:"FORBIDDEN"},{status:403});
  return privateAuthResponse(apiErrorResponse(error));
 }
}
