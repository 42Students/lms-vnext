import { boundedRequestJson } from "@/lib/bounded-request-json";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasMembershipRole} from "@/modules/identity/context";
import {listThreadMessages,TpoMessagingError} from "@/modules/placements/tpo-messaging-service";
import { route } from "@/security/route";
import { ROLE } from "@/modules/identity/roles";
import { noStoreJson } from "@/security/responses";
const confirm=z.strictObject({confirmed:z.literal(true)});
export const runtime="nodejs";
/** POST is the only TPO read acknowledgement; GET remains read-only. */
async function handlePOST(request:Request,{params}:{params:Promise<{threadId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const body=confirm.safeParse(await boundedRequestJson(request).catch(()=>null));
 const id=z.string().uuid().safeParse((await params).threadId);
 if(!body.success||!id.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,ROLE.TPO))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 try{
  await listThreadMessages(context,id.data);
  return noStoreJson({acknowledged:true});
 }catch(error){
  if(error instanceof TpoMessagingError)return NextResponse.json({error:"THREAD_NOT_FOUND"},{status:404});
  throw error;
 }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
