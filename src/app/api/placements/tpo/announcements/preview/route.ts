import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {tpoAudiencePreviewQuery,announcementPreviewScope} from "@/modules/announcements/tpo-audience-preview-query";
import {previewTpoCollegeAnnouncementVisibility,previewTpoPlacementAudience} from "@/modules/announcements/tpo-audience-preview-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
/** Scoped, non-cacheable count only; no recipient identities or contact data. */
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 if([...params.keys()].some(key=>!["audience","targetId","targetIds"].includes(key))||
    params.getAll("audience").length!==1||params.getAll("targetId").length>1||
    params.toString().length>3600)
   return Response.json({error:"INVALID_AUDIENCE"},{status:400});
 const selected=tpoAudiencePreviewQuery.safeParse({
  audience:params.get("audience"),
  targetId:params.get("targetId")||undefined,
  targetIds:params.getAll("targetIds").length?params.getAll("targetIds"):undefined,
 });
 if(!selected.success)return Response.json({error:"INVALID_AUDIENCE"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  const scope=announcementPreviewScope(selected.data);
  const preview=scope?await previewTpoPlacementAudience(context,scope):
   await previewTpoCollegeAnnouncementVisibility(context);
  return Response.json({...preview,emailReady:false},{
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof AuthorizationError)return Response.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return Response.json({error:"INVALID_AUDIENCE"},{status:400});
  return apiErrorResponse(error);
 }
}
