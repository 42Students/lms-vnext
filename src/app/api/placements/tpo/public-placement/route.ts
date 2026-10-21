import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {apiErrorResponse} from "@/lib/api-error";
import {publicPlacementPublicationInput} from "@/modules/placements/public-page/publication-policy";
import {setTpoPublicPlacementPublication,PublicPlacementPublishError,getTpoPublicPlacementLegacySettings} from "@/modules/placements/public-page/publication-service";
import {getPublicPlacementPageContent,saveTpoPublicPlacementContent} from "@/modules/placements/public-page/content-service";
import {publicPlacementContentInput} from "@/modules/placements/public-page/content-model";

export const runtime="nodejs";

export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 if(!form)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 const enabled=form.get("enabled");
 const parsed=publicPlacementPublicationInput.safeParse({
  enabled:enabled==="true"?true:enabled==="false"?false:null,
 });
 if(!parsed.success || form.has("populationCount") || form.has("collegeId"))
  return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const ctx=await getCurrentRequestContext();
  await setTpoPublicPlacementPublication(ctx,parsed.data);
  return NextResponse.redirect(new URL("/tpo/settings/public-page?updated=1",request.url),303);
 }catch(e){
  if(e instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(e instanceof PublicPlacementPublishError)
   return NextResponse.json({error:e.code},{status:e.code==="NOT_REGISTERED"?503:409});
  throw e;
 }
}

/** Legacy placement-page GET is scoped to the authenticated TPO, not a
 * caller-supplied college. Include optimistic content version for the PUT. */
export async function GET(){
 try{
  const ctx=await getCurrentRequestContext();
  const data=await getTpoPublicPlacementLegacySettings(ctx);
  if(!ctx.membership)throw new AuthorizationError("placements.manage");
  const content=await getPublicPlacementPageContent(ctx.membership.collegeId);
  return NextResponse.json({...data,contentVersion:content.updatedAt,
    links:{settings:"/tpo/settings/public-page",preview:"/placements"}},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}

const legacyPublicPagePut=z.union([
 z.strictObject({enabled:z.boolean()}),
 z.strictObject({
  about:z.string().trim().max(4000),numbers:z.array(z.string()).min(1).max(7),
  expectedUpdatedAt:z.iso.datetime().nullable(),
 }),
]);
/** Legacy PUT accepts either publication or content; keep each state change
 * independently auditable. Require the actual content version on edits. */
export async function PUT(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await request.json();
  const parsed=legacyPublicPagePut.safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:"INVALID_BODY",
   message:"Check the publication setting, text, selected numbers and saved version."},
   {status:400,headers:{"Cache-Control":"private, no-store"}});
  const ctx=await getCurrentRequestContext();
  if("enabled" in parsed.data){
   const state=await setTpoPublicPlacementPublication(ctx,{enabled:parsed.data.enabled});
   return NextResponse.json({state},{headers:{"Cache-Control":"private, no-store"}});
  }
  const contentInput=publicPlacementContentInput.safeParse({
   about:parsed.data.about,
   metricKeys:parsed.data.numbers,
   expectedUpdatedAt:parsed.data.expectedUpdatedAt,
  });
  if(!contentInput.success)return NextResponse.json({error:"INVALID_BODY",
   message:"Review the public number choices and content version."},
   {status:400,headers:{"Cache-Control":"private, no-store"}});
  const content=await saveTpoPublicPlacementContent(ctx,contentInput.data);
  return NextResponse.json({content},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof PublicPlacementPublishError)
   return NextResponse.json({error:error.code},
    {status:error.code==="NOT_REGISTERED"?503:409});
  return apiErrorResponse(error);
 }
}
