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


/** Legacy DELETE maps to a version-checked soft delete. A request with no
 * version is rejected instead of deleting an announcement another TPO edited.
 */
export async function DELETE(request:Request,{params}:{params:Promise<{noticeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {noticeId}=await params;
 const query=new URL(request.url).searchParams;
 let version:unknown=query.get("expectedVersion");
 if(version===null){
  const raw=await request.json().catch(()=>null);
  if(raw&&typeof raw==="object"&&!Array.isArray(raw))
   version=(raw as {expectedVersion?:unknown}).expectedVersion;
 }
 const parsed=z.object({noticeId:z.string().uuid(),
  expectedVersion:z.coerce.number().int().nonnegative()}).strict()
  .safeParse({noticeId,expectedVersion:version});
 if(!parsed.success)return NextResponse.json({error:"VERSION_REQUIRED",
  message:"Refresh the announcement and send its current version to delete it.",
 },{status:409,headers:{"Cache-Control":"private, no-store"}});
 try{
  await mutateTpoNotice(await getCurrentRequestContext(),{
   ...parsed.data,action:"DELETE",
  });
  return NextResponse.json({saved:true,softDeleted:true,noticeId,
   message:"Announcement deleted. Undo is available from Deleted announcements.",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof AuthorizationError)return noticePostError(request,"FORBIDDEN",403);
  if(error instanceof Error&&error.message==="ANNOUNCEMENT_STALE")
   return noticePostError(request,"STALE_VERSION",409);
  if(error instanceof Error&&error.message==="ANNOUNCEMENT_NOT_FOUND")
   return noticePostError(request,"NOT_FOUND",404);
  throw error;
 }
}
/** Legacy PUT /undo is restore or send-undo. Content edits have a separate
 * versioned editor; unknown legacy PUT bodies must never silently mutate.
 */
export async function PUT(request:Request,{params}:{params:Promise<{noticeId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {noticeId}=await params;
 const raw:unknown=await request.json().catch(()=>null);
 const parsed=z.strictObject({
  action:z.enum(["RESTORE","UNDO_SEND"]),
  expectedVersion:z.number().int().nonnegative(),
 }).safeParse(raw);
 if(!parsed.success)return NextResponse.json({
  error:"INVALID_LIFECYCLE_ACTION",
  message:"Use a versioned RESTORE or UNDO_SEND action. Edit title and message in the announcement editor.",
 },{status:422,headers:{"Cache-Control":"private, no-store"}});
 try{
  await mutateTpoNotice(await getCurrentRequestContext(),{
   noticeId,...parsed.data,
  });
  return NextResponse.json({saved:true,action:parsed.data.action,noticeId,
   message:parsed.data.action==="RESTORE"?"Announcement restored":"Announcement send undone",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof AuthorizationError)return noticePostError(request,"FORBIDDEN",403);
  if(error instanceof Error&&error.message==="ANNOUNCEMENT_UNDO_EXPIRED")
   return NextResponse.json({error:"UNDO_WINDOW_EXPIRED",
    message:"The 30-second Undo window has ended. Refresh announcements."},
    {status:409,headers:{"Cache-Control":"private, no-store"}});
  if(error instanceof Error&&error.message==="ANNOUNCEMENT_STALE")
   return noticePostError(request,"STALE_VERSION",409);
  if(error instanceof Error&&error.message==="ANNOUNCEMENT_NOT_FOUND")
   return noticePostError(request,"NOT_FOUND",404);
  throw error;
 }
}
