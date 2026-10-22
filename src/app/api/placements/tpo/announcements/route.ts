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
 const isJson=request.headers.get("content-type")?.toLowerCase().includes("application/json")??false;
 let form:FormData|null=null;
 if(isJson){
  const raw=await request.text().catch(()=>"");
  if(raw.length>24000)return noticePostError(request,"INVALID_BODY",413);
  let body:unknown;
  try{body=JSON.parse(raw);}catch{return noticePostError(request,"INVALID_BODY",400);}
  if(!body||typeof body!=="object"||Array.isArray(body))
   return noticePostError(request,"INVALID_BODY",400);
  const fields=body as Record<string,unknown>;
  // Old POST /api/v1/tpo/announcements accepts JSON but the authenticated
  // vNext write service still owns all audience and schedule validation.
  form=new FormData();
  for(const name of ["title","message","body","buttonLabel","buttonUrl","linkLabel","linkUrl",
    "sendAt","showUntil","when","audience","kind","targetId"]){
   if(typeof fields[name]==="string")form.set(name,fields[name]);
  }
  if(fields["pinned"]===true)form.set("pinned","on");
  if(Array.isArray(fields["targetIds"])){
   for(const id of fields["targetIds"].slice(0,51)){
    if(typeof id!=="string")return noticePostError(request,"INVALID_BODY",400);
    form.append("targetIds",id);
   }
  }
  // Email delivery, read receipts and tell-again have their own delivery
  // contracts. Do not silently pretend these old write flags were processed.
  if(fields["email"]===true||fields["notifyByEmail"]===true||fields["tellAgain"]===true)
   return NextResponse.json({error:"UNSUPPORTED_LEGACY_DELIVERY",
    message:"This action cannot send email or tell-again notifications. Create an in-app notice instead."},
    {status:422});
 }else{
  form=await request.formData().catch(()=>null);
 }
 if(!form)return noticePostError(request,"INVALID_BODY",400);
 // Legacy composer fields: body -> message, linkLabel/Url -> buttonLabel/Url,
 // when=NOW/LATER -> sendAt, audience.kind -> audience. Read-only mapping:
 // historical recipient and read-receipt rows require a separate scoped import.
 // Never infer a new audience from ambiguous historical targeting.
 const when=String(form.get("when")??"NOW");
 if(when!=="NOW"&&when!=="LATER")
  return noticePostError(request,"INVALID_TIME",400);
 const sendAt=String(form.get("sendAt")??"").trim();
 if(when==="LATER"&&!sendAt)
  return noticePostError(request,"INVALID_TIME",400);
 const audienceInput=String(form.get("audience")??form.get("kind")??"COLLEGE");
 const audience=audienceInput==="ALL"?"COLLEGE":audienceInput;
 const parsed=z.object({
  title:z.string(),message:z.string(),pinned:z.boolean(),
  buttonLabel:z.string().optional(),buttonUrl:z.string().optional(),
  sendAt:z.string().optional(),showUntil:z.string().optional(),
  audience:z.enum(["COLLEGE","PLACEMENTS","BATCHES","BRANCHES","DRIVE"]).default("COLLEGE"),
  targetId:z.string().uuid().optional(),
  targetIds:z.array(z.string().uuid()).max(50).optional(),
 }).strict().safeParse({
  title:form.get("title"),message:form.get("message")??form.get("body"),
  pinned:form.get("pinned")==="on",
  buttonLabel:String(form.get("buttonLabel")??form.get("linkLabel")??"").trim()||undefined,
  buttonUrl:String(form.get("buttonUrl")??form.get("linkUrl")??"").trim()||undefined,
  sendAt:when==="LATER"?sendAt||undefined:(sendAt||undefined),
  showUntil:String(form.get("showUntil")??"")||undefined,
  audience,
  targetId:String(form.get("targetId")??"")||undefined,
  targetIds:form.getAll("targetIds").length?form.getAll("targetIds").map(String):undefined,
 });
 if(!parsed.success){
  const field=parsed.error.issues[0]?.path[0];
  return noticePostError(request,field==="title"?"TITLE_REQUIRED":
   field==="message"?"MESSAGE_REQUIRED":field==="buttonUrl"?"BUTTON_URL_INVALID":
   field==="sendAt"?"INVALID_TIME":"INVALID_BODY",400);
 }
 try{
  const context=await getCurrentRequestContext();
  const notice=await createTpoNotice(context,parsed.data);
  if(isJson)return NextResponse.json({
    status:"success",message:"Announcement created",announcement:notice,
    data:notice,recipientSnapshot:"FROZEN_AT_CREATION",
    lifecycle:{edit:"/api/placements/tpo/announcements/"+notice.id+"/edit",
      undo:"/api/placements/tpo/announcements/"+notice.id+"/lifecycle"},
  },{status:201,headers:{"Cache-Control":"no-store"}});
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
  if(error instanceof Error&&error.message==="TPO_NOTICE_DELIVERY_UNVERIFIED")
   return noticePostError(request,"TPO_NOTICE_DELIVERY_UNVERIFIED",503);
  if(error instanceof Error && (error.message==="TARGETED_NOTICES_NOT_REGISTERED" ||
    error.message==="TPO_NOTICE_NO_RECIPIENTS"))
    return noticePostError(request,error.message,error.message==="TARGETED_NOTICES_NOT_REGISTERED"?503:409);
  if(error instanceof Error && error.message==="ANNOUNCEMENTS_NOT_REGISTERED")
   return noticePostError(request,"ANNOUNCEMENTS_NOT_REGISTERED",503);
  throw error;
 }
}
