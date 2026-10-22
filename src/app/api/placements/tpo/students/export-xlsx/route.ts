import { legacyGridExportFilename,legacySavedViewExportFilename } from "@/modules/placements/grid-export-filename";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,departments,programs,sections} from "@/db/schema";
import {tpoStudentExportViewName} from "@/modules/placements/tpo-students-url-guard";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoStudentsIntelligence,tpoStudentsQueryObjectSchema,tpoStudentsRangeRefinement} from "@/modules/placements/tpo-students-service";
import {exportTpoStudentsXlsx} from "@/modules/placements/tpo-students-xlsx";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const ctx=await getCurrentRequestContext();
  if(!ctx.membership||!hasMembershipRole(ctx,"TPO"))throw new AuthorizationError("placements.manage");
  const url=new URL(request.url);
  const raw=Object.fromEntries(url.searchParams.entries());
  const ids=raw["ids"];
  if(url.searchParams.getAll("view").length>1)return Response.json({error:"Repeated view names are not allowed"},{status:400});
  const viewName=raw["view"]===undefined?"Filtered placement students":tpoStudentExportViewName(raw["view"]);
  if(!viewName)return Response.json({error:"Invalid saved view name"},{status:400});
  const savedViewRequested=raw["view"]!==undefined;
  const downloadName=savedViewRequested?viewName:"students";
  const cols=raw["columns"]?.split(",")??[];
  delete raw["ids"];delete raw["columns"];delete raw["selected"];delete raw["view"];
  delete raw["student"];delete raw["page"];delete raw["pageSize"];
  if(raw["q"]!==undefined){if(raw["search"]!==undefined)return Response.json({error:"Ambiguous search"},{status:400});raw["search"]=raw["q"];delete raw["q"];}
  const filters=tpoStudentsQueryObjectSchema.omit({collegeId:true,page:true,pageSize:true}).superRefine(tpoStudentsRangeRefinement).parse(raw);
  const result=await getTpoStudentsIntelligence(ctx,{...filters,collegeId:ctx.membership.collegeId,page:1,pageSize:25},{includeExportRows:true});
  const matched=result.exportRows??[];
  const idsList=ids==="ALL"?null:ids?.split(",").filter(Boolean)??null;
  if(idsList&&(idsList.length>200||new Set(idsList).size!==idsList.length||
    idsList.some(id=>!matched.some(row=>row.membershipId===id))))return Response.json({error:"Invalid selected rows"},{status:400});
  const subset=idsList?matched.filter(row=>idsList.includes(row.membershipId)):matched;
  const classIds=[...new Set(subset.flatMap(row=>row.classIds))];
  const sectionNames=classIds.length?await getDb().select({
    id:sections.id,name:sections.name,
  }).from(sections)
    .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(and(eq(departments.collegeId,ctx.membership.collegeId),
      inArray(sections.id,classIds))):[];
  const bytes=exportTpoStudentsXlsx(subset,cols,viewName,
    Object.fromEntries(sectionNames.map(row=>[row.id,row.name])));
  return new Response(new Uint8Array(bytes),{headers:{
   "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
   "Content-Disposition":'attachment; filename="' + (!savedViewRequested?legacyGridExportFilename(downloadName, "xlsx"):
    legacySavedViewExportFilename(viewName, "xlsx")) + '"',
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Vary":"Cookie",
  }});
 }catch(error){return apiErrorResponse(error);}
}
