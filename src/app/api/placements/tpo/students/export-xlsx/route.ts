import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoStudentsIntelligence,tpoStudentsQuerySchema} from "@/modules/placements/tpo-students-service";
import {exportTpoStudentsXlsx} from "@/modules/placements/tpo-students-xlsx";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const ctx=await getCurrentRequestContext();
  if(!ctx.membership||!hasMembershipRole(ctx,"TPO"))throw new AuthorizationError("placements.manage");
  const url=new URL(request.url);
  const raw=Object.fromEntries(url.searchParams.entries());
  const ids=raw.ids;
  const viewName=raw.view??"Filtered placement students";
  const cols=raw.columns?.split(",")??[];
  delete raw.ids;delete raw.columns;delete raw.selected;delete raw.view;
  delete raw.student;delete raw.page;delete raw.pageSize;
  if(raw.q!==undefined){if(raw.search!==undefined)return Response.json({error:"Ambiguous search"},{status:400});raw.search=raw.q;delete raw.q;}
  const filters=tpoStudentsQuerySchema.omit({collegeId:true,page:true,pageSize:true}).parse(raw);
  const result=await getTpoStudentsIntelligence(ctx,{...filters,collegeId:ctx.membership.collegeId,page:1,pageSize:25},{includeExportRows:true});
  const matched=result.exportRows??[];
  const idsList=ids==="ALL"?null:ids?.split(",").filter(Boolean)??null;
  if(idsList&&(idsList.length>200||new Set(idsList).size!==idsList.length||
    idsList.some(id=>!matched.some(row=>row.membershipId===id))))return Response.json({error:"Invalid selected rows"},{status:400});
  const subset=idsList?matched.filter(row=>idsList.includes(row.membershipId)):matched;
  const bytes=exportTpoStudentsXlsx(subset,cols,viewName);
  return new Response(new Uint8Array(bytes),{headers:{
   "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
   "Content-Disposition":'attachment; filename="tpo-students.xlsx"',
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Vary":"Cookie",
  }});
 }catch(error){return apiErrorResponse(error);}
}
