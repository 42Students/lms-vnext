import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
import {listPaginatedDeletedProjectWorkspaces} from "@/modules/projects/project-soft-delete-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const pageSchema=z.object({
 page:z.string().regex(/^[1-9][0-9]{0,5}$/).default("1"),
 pageSize:z.enum(["10","20","50","100"]).default("20"),
}).strict();

/** GET /api/projects/deleted — authorized, page-bounded recovery directory. */
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const collegeId=getProjectAdminCollegeId(context);
  if(!collegeId)return NextResponse.json({
   error:"COLLEGE_NOT_SELECTED",message:"Select a college to continue.",
  },{status:409,headers:{"Cache-Control":"private, no-store"}});
  const params=new URL(request.url).searchParams;
  const raw=Object.fromEntries(params.entries());
  const parsed=pageSchema.safeParse(raw);
  if(!parsed.success||Number(parsed.data.page)>100000)
   return NextResponse.json({error:"INVALID_PAGINATION",
    message:"Choose a valid page and 10, 20, 50 or 100 rows per page."},
    {status:400,headers:{"Cache-Control":"private, no-store"}});
  const page=Number(parsed.data.page),pageSize=Number(parsed.data.pageSize);
  const result=await listPaginatedDeletedProjectWorkspaces(context,collegeId,{page,pageSize});
  return NextResponse.json({
   ...result,items:result.items.map(item=>({
    ...item,deletedAt:item.deletedAt?.toISOString()??null,
    updatedAt:item.updatedAt.toISOString(),
   })),
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
