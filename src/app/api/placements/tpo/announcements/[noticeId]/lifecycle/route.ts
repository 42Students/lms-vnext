import {NextResponse} from "next/server";
import {noticePostError} from "../../form-error-response";
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
  noticeId:z.string().uuid(),action:z.enum(["DELETE","RESTORE","UNDO_SEND"]),
  expectedVersion:z.coerce.number().int().nonnegative(),
 }).strict().safeParse({
  noticeId,action:form?.get("action"),expectedVersion:form?.get("expectedVersion"),
 });
 if(!parsed.success)return noticePostError(request,"INVALID_BODY",400);
 try{
  await mutateTpoNotice(await getCurrentRequestContext(),parsed.data);
  if(request.headers.get("accept")?.includes("application/json"))
   return NextResponse.json({saved:true,action:parsed.data.action,noticeId},
    {headers:{"Cache-Control":"private, no-store"}});
  const tab=parsed.data.action==="RESTORE"?"deleted":"yours";
  const destination=new URL("/tpo/announcements?tab="+tab,request.url);
  if(parsed.data.action==="DELETE")destination.searchParams.set("noticeSuccess","DELETED");
  return NextResponse.redirect(destination,303);
 }catch(error){
  if(error instanceof AuthorizationError)return noticePostError(request,"FORBIDDEN",403);
  if(error instanceof z.ZodError)return noticePostError(request,"INVALID_BODY",400);
  if(error instanceof Error&&error.message==="ANNOUNCEMENT_NOT_FOUND")
   return noticePostError(request,"NOT_FOUND",404);
  if(error instanceof Error&&error.message==="ANNOUNCEMENT_UNDO_EXPIRED"){
   if(request.headers.get("accept")?.includes("text/html"))
    return noticePostError(request,"UNDO_WINDOW_EXPIRED",409);
   return NextResponse.json({
    error:"UNDO_WINDOW_EXPIRED",
    message:"The 30-second Undo window has ended. Refresh announcements to see the current state.",
   },{status:409,headers:{"Cache-Control":"no-store"}});
  }
  if(error instanceof Error&&error.message==="ANNOUNCEMENT_STALE")
   return noticePostError(request,"STALE_VERSION",409);
  if(error instanceof Error&&error.message==="ANNOUNCEMENTS_NOT_REGISTERED")
   return noticePostError(request,"ANNOUNCEMENTS_NOT_REGISTERED",503);
  throw error;
 }
}
