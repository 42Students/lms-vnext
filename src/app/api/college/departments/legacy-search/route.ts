import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {fetchPagedDepartments} from "@/modules/departments/service";
import {filterDepartmentRows,type DepartmentDirectoryRow} from "@/modules/admin-ui/department-directory";

export const runtime="nodejs";
const inputSchema=z.strictObject({
 mode:z.enum(["search","popular","college","categories","category","stats","exists"]).default("search"),
 q:z.string().trim().max(120).default(""),
 collegeId:z.string().uuid().optional(),
 category:z.string().trim().max(120).optional(),
 limit:z.coerce.number().int().min(1).max(100).optional(),
});
/**
 * Compatibility reader for the seven historic department-search operations.
 * Every page is obtained from fetchPagedDepartments, whose database WHERE
 * clause enforces current membership or selected Super Admin scope. Browser
 * input cannot raise those permissions.
 *
 * Popularity is not inferred from academic use counts: selections require a
 * persisted, separately permissioned analytics table before ranking is safe.
 */
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const search=new URL(request.url).searchParams;
  const allowed=new Set(["mode","q","collegeId","category","limit"]);
  if([...search.keys()].some(key=>!allowed.has(key)||search.getAll(key).length!==1))
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const parsed=inputSchema.safeParse(Object.fromEntries(search.entries()));
  if(!parsed.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const input=parsed.data;
  const limit=input.limit??(input.mode==="college"?50:input.mode==="popular"?10:15);
  // A bounded scan allows cross-college Super Admin search without
  // broadening normal college-member authorization. No cache of tenant data.
  const rows:DepartmentDirectoryRow[]=[];
  let total=0;
  for(let page=0;page<100;page++){
   const result=await fetchPagedDepartments(context,{
    ...(input.collegeId?{collegeId:input.collegeId}:{}),page,size:100,
   });
   total=result.totalElements;
   rows.push(...result.content.map(row=>({
    id:row.id,name:row.name,collegeId:row.collegeId,
    collegeName:row.collegeName,createdAt:row.createdAt.toISOString(),
    usage:null,
   })));
   if(rows.length>=total)break;
  }
  const truncated=rows.length<total;
  const headers={"Cache-Control":"private, no-store"};
  if(input.mode==="stats"){
   return NextResponse.json({departments:total,
    colleges:[...new Set(rows.map(row=>row.collegeId))].length,
    complete:!truncated},{headers});
  }
  if(input.mode==="categories"){
   return NextResponse.json({items:[...new Set(rows.map(row=>row.collegeName)
    .filter((name):name is string=>Boolean(name)))].sort((a,b)=>a.localeCompare(b,"en-IN")),
    complete:!truncated},{headers});
  }
  if(input.mode==="exists"){
   return NextResponse.json({exists:filterDepartmentRows(rows,input.q).length>0,
    complete:!truncated},{headers});
  }
  if(input.mode==="popular"){
   return NextResponse.json({items:[],available:false,
    message:"Department selection popularity is unavailable until a persisted, scoped counter is configured."},
    {headers});
  }
  const scoped=input.mode==="category"?
   rows.filter(row=>row.collegeName===input.category):rows;
  const matched=filterDepartmentRows(scoped,input.mode==="college"?"":input.q);
  return NextResponse.json({items:matched.slice(0,limit),total:matched.length,
   limit,complete:!truncated,
   ...(input.mode==="category"?{category:input.category??""}:{}),
  },{headers});
 }catch(error){return apiErrorResponse(error);}
}
/** Recording a selection without durable storage would invent popularity
 * counts and lose data on restart. Do not acknowledge a write until migration
 * and tenant-scoped storage have been added by the data owner.
 */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  await getCurrentRequestContext();
  return NextResponse.json({error:"SELECTION_ANALYTICS_UNAVAILABLE",
   message:"Selection analytics are not configured. Department selection is still available in the directory."},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
