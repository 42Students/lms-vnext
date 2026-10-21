import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {
 adminContentKindSchema,adminContentQuerySchema,
} from "@/modules/courses/super-admin-content-directory-model";
import {listSuperAdminContentDirectory} from "@/modules/courses/super-admin-content-directory-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function csvCell(value:unknown):string{
 const string=value==null?"":String(value);
 return '"'+(/^[\s]*[=+@-]/.test(string)?"'"+string:string).replaceAll('"','""')+'"';
}
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const allowed=new Set(["kind","q","status","offeringId","lessonId","deliveryId","scope"]);
  if([...params.keys()].some(key=>!allowed.has(key)||params.getAll(key).length!==1))
   return Response.json({error:"INVALID_FILTERS"},{status:400});
  const kind=adminContentKindSchema.parse(params.get("kind"));
  const filters=adminContentQuerySchema.parse({
   q:params.get("q")??undefined,status:params.get("status")??undefined,
   offeringId:params.get("offeringId")??undefined,
   lessonId:params.get("lessonId")??undefined,
   deliveryId:params.get("deliveryId")??undefined,
   scope:params.get("scope")??undefined,
   page:1,
  });
  const context=await getCurrentRequestContext();
  // Every page repeats the Super Admin + selected college authorization.
  // Keep export fully scoped and refuse truncation rather than silently
  // dropping matching rows past the backend's 1000-page query cap.
  const first=await listSuperAdminContentDirectory(context,kind,filters);
  if(first.totalPages>1000)return Response.json({
   error:"EXPORT_TOO_LARGE",message:"Apply more specific course and lesson filters before exporting.",
  },{status:413,headers:{"Cache-Control":"private, no-store"}});
  const rows=[...first.items];
  for(let page=2;page<=first.totalPages;page++){
   const current=await listSuperAdminContentDirectory(context,kind,{...filters,page});
   rows.push(...current.items);
  }
  const headers=["id","title","type","sequence","points","deadline","durationSeconds","active","enabled"];
  const lines=[headers.map(csvCell).join(",")];
  for(const row of rows)lines.push([
   row.id,row.title,row.contentType,row.sequence,row.points,
   row.endsAt?.toISOString()??"",
   row.durationSeconds??"",
   row.status==="ARCHIVED"?"no":"yes",
   row.visibleToStudents?"yes":"no",
  ].map(csvCell).join(","));
  return new Response("\uFEFF"+lines.join("\r\n")+"\r\n",{
   status:200,headers:{
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="lesson-content.csv"',
    "Cache-Control":"private, no-store",
    "X-Content-Type-Options":"nosniff",
   },
  });
 }catch(error){return apiErrorResponse(error);}
}
