import "server-only";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoMessagesPulse} from "@/modules/placements/tpo-messages-service";
import {apiErrorResponse} from "@/lib/api-error";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";

async function handleGET(){
 try{
  const context=await getCurrentRequestContext();
  const pulse=await getTpoMessagesPulse(context);
  // Only a change token, never recruiter content or member contact details.
  const version=JSON.stringify([
   pulse.source,pulse.ready,pulse.total,pulse.unread,pulse.reply,
   pulse.lastId,pulse.lastOccurredAt,
  ]);
  return Response.json({version},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
