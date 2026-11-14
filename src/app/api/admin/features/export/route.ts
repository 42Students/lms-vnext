import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {adminFeatureQuerySchema} from "@/modules/module-access/admin-feature-query";
import {listSuperAdminFeatureControls} from "@/modules/module-access/admin-read-service";
import {superAdminFeaturePageCsv} from "@/modules/module-access/admin-feature-export";
import { route } from "@/security/route";
import { attachmentHeader } from "@/security/downloads";
export const runtime="nodejs";
async function handleGET(request:Request){
 try{
  const input:Record<string,string>={};
  for(const [key,value] of new URL(request.url).searchParams){
   if(Object.hasOwn(input,key))return Response.json({error:"INVALID_REQUEST"},{status:400,headers:{"cache-control":"private, no-store"}});
   input[key]=value;
  }
  const query=adminFeatureQuerySchema.parse(input);
  const result=await listSuperAdminFeatureControls(await getCurrentRequestContext(),query);
  return new Response(superAdminFeaturePageCsv(result.items),{headers:{
   "content-type":"text/csv; charset=utf-8",
   "content-disposition":attachmentHeader("super-admin-feature-matrix-page.csv"),
   "cache-control":"private, no-store",
   "x-export-row-count":String(result.items.length),
   "x-export-total-matches":String(result.total),
  }});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
