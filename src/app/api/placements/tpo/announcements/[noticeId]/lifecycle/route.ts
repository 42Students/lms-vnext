import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {mutateTpoNotice} from "@/modules/announcements/tpo-placement-notice-lifecycle";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{noticeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 const {noticeId}=await params;
 const parsed=z.object({
  noticeId:z.string().uuid(),action:z.enum(["DELETE","RESTORE"]),
  expectedVersion:z.coerce.number().int().nonnegative(),
 }).strict().safeParse({
  noticeId,action:form?.get("action"),expectedVersion:form?.get("expectedVersion"),
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  await mutateTpoNotice(await getCurrentRequestContext(),parsed.data);
  const tab=parsed.data.action==="DELETE"?"yours":"deleted";
  return NextResponse.redirect(new URL("/tpo/announcements?tab="+tab,request.url),303);
 }catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(error instanceof Error&&error.message==="ANNOUNCEMENT_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof Error&&error.message==="ANNOUNCEMENT_STALE")
   return NextResponse.json({error:"STALE_VERSION"},{status:409});
  if(error instanceof Error&&error.message==="ANNOUNCEMENTS_NOT_REGISTERED")
   return NextResponse.json({error:"ANNOUNCEMENTS_NOT_REGISTERED"},{status:503});
  throw error;
 }
}
