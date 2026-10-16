import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {createTpoNotice} from "@/modules/announcements/tpo-placement-write-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 if(!form)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 const parsed=z.object({
  title:z.string(),message:z.string(),pinned:z.boolean(),
  sendAt:z.string().optional(),showUntil:z.string().optional(),
  audience:z.enum(["COLLEGE","PLACEMENTS","BATCHES","BRANCHES","DRIVE"]).default("COLLEGE"),
  targetId:z.string().uuid().optional(),
 }).strict().safeParse({
  title:form.get("title"),message:form.get("message"),pinned:form.get("pinned")==="on",
  sendAt:String(form.get("sendAt")??"")||undefined,
  showUntil:String(form.get("showUntil")??"")||undefined,
  audience:String(form.get("audience")??"COLLEGE"),
  targetId:String(form.get("targetId")??"")||undefined,
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  await createTpoNotice(context,parsed.data);
  return NextResponse.redirect(new URL("/tpo/announcements?tab=yours",request.url),303);
 }catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError || (error instanceof Error&&error.message==="TPO_NOTICE_INVALID_TIME"))return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(error instanceof Error && (error.message==="TARGETED_NOTICES_NOT_REGISTERED" ||
    error.message==="TPO_NOTICE_NO_RECIPIENTS"))
    return NextResponse.json({error:error.message},{status:error.message==="TARGETED_NOTICES_NOT_REGISTERED"?503:409});
  if(error instanceof Error && error.message==="ANNOUNCEMENTS_NOT_REGISTERED")
   return NextResponse.json({error:"ANNOUNCEMENTS_NOT_REGISTERED"},{status:503});
  throw error;
 }
}
