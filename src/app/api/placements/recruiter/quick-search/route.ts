import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {apiErrorResponse} from "@/lib/api-error";
import {recruiterDriveListQuerySchema} from "@/modules/placements/recruiter-drive-list-model";
import {searchOwnRecruiterDrives} from "@/modules/placements/recruiter-drive-search-service";

export const runtime="nodejs";
const uuid=z.string().uuid();
const term=z.string().trim().min(2).max(100);

/** Recruiter Everywhere: search ONLY drives belonging to this exact
 * recruiter/company and an explicitly authorized college, never a global
 * student or company index. A chooser is mandatory for multi-college users. */
export async function GET(request:NextRequest){
 try{
  const params=request.nextUrl.searchParams;
  if(params.getAll("q").length!==1||params.getAll("collegeId").length>1)
   return NextResponse.json({error:"Invalid search filters"},{status:400});
  const parsed=term.safeParse(params.get("q")??"");
  if(!parsed.success)
   return NextResponse.json({error:"Enter 2–100 characters."},{status:400});
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||!context.recruiter||
     context.recruiter.userId!==context.user.id)
   return NextResponse.json({error:"Access denied"},{status:403});
  const grants=context.recruiter.grants;
  const choice=params.get("collegeId");
  if(choice&&!uuid.safeParse(choice).success)
   return NextResponse.json({error:"Invalid college selection"},{status:400});
  const allowed=grants.some(item=>item.collegeId===choice);
  if(choice&&!allowed)return NextResponse.json({error:"College unavailable"},{status:404});
  const collegeId=choice??(new Set(grants.map(item=>item.collegeId)).size===1?grants[0]?.collegeId:null);
  if(!collegeId){
   const unique=new Map(grants.map(item=>[item.collegeId,item.collegeName]));
   return NextResponse.json({
    results:[],chooseCollege:true,choices:Array.from(unique,([id,name])=>({id,name})),
   },{headers:{"Cache-Control":"private, no-store"}});
  }
  const filter=recruiterDriveListQuerySchema.parse({
   collegeId,q:parsed.data,view:"ALL",page:1,sort:"RECENT",
  });
  const data=await searchOwnRecruiterDrives(context,collegeId,filter,new Date(),{
   pageSize:8,previewOnly:true,
  });
  const results=data.rows.map(item=>({
   key:item.job.id,kind:"Drive" as const,
   title:item.job.title,
   context:item.companyName+" · "+item.collegeName,
   href:"/recruiter/drives/"+encodeURIComponent(item.job.id),
  }));
  return NextResponse.json({results,chooseCollege:false,choices:[]},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
