import { boundedRequestJson } from "@/lib/request-body";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {requireGlobalLogAdmin} from "@/modules/log-alerts/admin-service";
import {sendManualTelegramAlertForAdmin} from "@/modules/log-alerts/manual-ops";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
const inputSchema=z.strictObject({kind:z.enum(["TEST","DIGEST"])});
async function handlePOST(request:Request){
  if(!isSameOriginRequest(request))
    return NextResponse.json({message:"This request could not be completed."},{status:403});
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE")
    return NextResponse.json({message:"Not authorized."},{status:403});
  try{requireGlobalLogAdmin(context);}
  catch{return NextResponse.json({message:"Not authorized."},{status:403});}
  const parsed=inputSchema.safeParse(await boundedRequestJson(request).catch(()=>null));
  if(!parsed.success)
    return NextResponse.json({message:"Choose a valid alert type."},{status:400});
  try{
    const result=await sendManualTelegramAlertForAdmin(context,parsed.data.kind);
    // Throttle compares accepted provider attempts; a digest already
    // accepted within ten minutes must not be submitted twice.
    if(result.reason==="RATE_LIMITED")
      return NextResponse.json({message:"A manual alert was sent recently. Try again in 10 minutes."},
        {status:429,headers:{"Retry-After":"600","Cache-Control":CACHE.NONE}});
    if(result.reason==="UNCONFIGURED")
      return NextResponse.json({
        configured:false,accepted:false,delivered:null,
        message:"Telegram alerts are not configured.",
      },{status:503});
    if(!result.sent)
      return NextResponse.json({message:"Telegram could not confirm delivery. Try again later."},{status:503});
    // Provider acceptance does not confirm that a user received the alert.
    return NextResponse.json({
      configured:true,accepted:true,delivered:null,sent:true,
      message:"Telegram accepted the alert request. Delivery is not confirmed.",
    },{headers:{"Cache-Control":CACHE.NONE}});
  }catch{
    return NextResponse.json({message:"Could not send the alert. Try again later."},{status:503});
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
