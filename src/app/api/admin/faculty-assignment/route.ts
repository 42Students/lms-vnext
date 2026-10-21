import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listAdminFacultyAssignments} from "@/modules/admin-ui/super-admin-faculty-assignments-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Zero-based legacy admin read adapter. All college scope comes from the
 * authenticated selected SA college or active College Admin membership. */
const legacyQuery=z.strictObject({
 page:z.coerce.number().int().min(0).max(999),
 size:z.coerce.number().int().min(1).max(200),
 classId:z.string().uuid().optional(),
 status:z.enum(["ALL","ACTIVE","ENDED"]),
 q:z.string().trim().max(100),
 collegeId:z.string().uuid().optional(),
});
export async function GET(request:Request){
 try{
  const query=new URL(request.url).searchParams;
  for(const key of new Set(query.keys())){
   if(query.getAll(key).length!==1||!["page","size","classId","status","q","collegeId"].includes(key))
    return NextResponse.json({error:"INVALID_FILTERS"},{status:400});
  }
  const parsed=legacyQuery.safeParse({
   page:query.get("page")??0,size:query.get("size")??25,
   classId:query.get("classId")??undefined,status:query.get("status")??"ALL",
   q:query.get("q")??"",collegeId:query.get("collegeId")??undefined,
  });
  if(!parsed.success)return NextResponse.json({error:"INVALID_FILTERS"},{status:400});
  const context=await getCurrentRequestContext();
  const selected=context.user.systemRoles.includes("SUPER_ADMIN")?
   context.adminScope?.collegeId:context.membership?.collegeId;
  if(parsed.data.collegeId&&parsed.data.collegeId!==selected)
   return NextResponse.json({error:"COLLEGE_SCOPE_MISMATCH"},{status:403});
  const {page,size,status,classId,q}=parsed.data,offset=page*size;
  const basePage=Math.floor(offset/200)+1,index=offset%200;
  if(basePage>1000)return NextResponse.json({error:"PAGE_OUT_OF_RANGE"},{status:400});
  const input={q,status,sectionId:classId,page:basePage,pageSize:200};
  const first=await listAdminFacultyAssignments(context,input);
  let content=[...first.items.slice(index,index+size)];
  if(index+size>200&&basePage<first.totalPages){
   const second=await listAdminFacultyAssignments(context,{...input,page:basePage+1});
   content=content.concat(second.items.slice(0,size-content.length));
  }
  return NextResponse.json({content,totalElements:first.total,
   totalPages:Math.max(1,Math.ceil(first.total/size)),page,size},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
