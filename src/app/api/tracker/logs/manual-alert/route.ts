import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {requireGlobalLogAdmin} from "@/modules/log-alerts/admin-service";
import {sendManualTelegramAlertForAdmin} from "@/modules/log-alerts/manual-ops";

export const runtime="nodejs";
const inputSchema=z.strictObject({kind:z.enum(["TEST","DIGEST"])});
export async function POST(request:Request){
  if(!isSameOriginRequest(request))
    return NextResponse.json({message:"This request could not be completed."},{status:403});
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE")
    return NextResponse.json({message:"Not authorized."},{status:403});
  try{requireGlobalLogAdmin(context);}
  catch{return NextResponse.json({message:"Not authorized."},{status:403});}
  const parsed=inputSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)
    return NextResponse.json({message:"Choose a valid alert type."},{status:400});
  try{
    const result=await sendManualTelegramAlertForAdmin(context,parsed.data.kind);
    if(result.reason==="RATE_LIMITED")
      return NextResponse.json({message:"A manual alert was sent recently. Try again in 10 minutes."},
        {status:429,headers:{"Retry-After":"600"}});
    if(result.reason==="UNCONFIGURED")
      return NextResponse.json({message:"Telegram alerts are not configured."},{status:503});
    if(!result.sent)
      return NextResponse.json({message:"Telegram could not confirm delivery. Try again later."},{status:503});
    return NextResponse.json({sent:true,message:"Alert sent to Telegram."},
      {headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({message:"Could not send the alert. Try again later."},{status:503});
  }
}
