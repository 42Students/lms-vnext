import {NextResponse} from "next/server";
import {noticePostError} from "./form-error-response";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {createTpoNotice} from "@/modules/announcements/tpo-placement-write-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 if(!form)return noticePostError(request,"INVALID_BODY",400);
 const parsed=z.object({
  title:z.string(),message:z.string(),pinned:z.boolean(),
  buttonLabel:z.string().optional(),buttonUrl:z.string().optional(),
  sendAt:z.string().optional(),showUntil:z.string().optional(),
  audience:z.enum(["COLLEGE","PLACEMENTS","BATCHES","BRANCHES","DRIVE"]).default("COLLEGE"),
  targetId:z.string().uuid().optional(),
  targetIds:z.array(z.string().uuid()).max(50).optional(),
 }).strict().safeParse({
  title:form.get("title"),message:form.get("message"),pinned:form.get("pinned")==="on",
  buttonLabel:String(form.get("buttonLabel")??"").trim()||undefined,
  buttonUrl:String(form.get("buttonUrl")??"").trim()||undefined,
  sendAt:String(form.get("sendAt")??"")||undefined,
  showUntil:String(form.get("showUntil")??"")||undefined,
  audience:String(form.get("audience")??"COLLEGE"),
  targetId:String(form.get("targetId")??"")||undefined,
  targetIds:form.getAll("targetIds").length?form.getAll("targetIds").map(String):undefined,
 });
 if(!parsed.success)return noticePostError(request,"INVALID_BODY",400);
 try{
  const context=await getCurrentRequestContext();
  const notice=await createTpoNotice(context,parsed.data);
  const returnUrl=new URL("/tpo/announcements?tab=yours",request.url);
  returnUrl.searchParams.set("sentNotice",notice.id);
  return NextResponse.redirect(returnUrl,303);
 }catch(error){
  if(error instanceof AuthorizationError)return noticePostError(request,"FORBIDDEN",403);
  if(error instanceof z.ZodError){
   const field=error.issues[0]?.path[0];
   return noticePostError(request,field==="title"?"TITLE_REQUIRED":field==="message"?"MESSAGE_REQUIRED":
    field==="buttonUrl"?"BUTTON_URL_INVALID":"INVALID_BODY",400);
  }
  if(error instanceof Error&&error.message==="TPO_NOTICE_INVALID_TIME")return noticePostError(request,"INVALID_TIME",400);
  if(error instanceof Error && (error.message==="TARGETED_NOTICES_NOT_REGISTERED" ||
    error.message==="TPO_NOTICE_NO_RECIPIENTS"))
    return noticePostError(request,error.message,error.message==="TARGETED_NOTICES_NOT_REGISTERED"?503:409);
  if(error instanceof Error && error.message==="ANNOUNCEMENTS_NOT_REGISTERED")
   return noticePostError(request,"ANNOUNCEMENTS_NOT_REGISTERED",503);
  throw error;
 }
}
