import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {collegeRoleDirectoryQuerySchema} from "@/modules/people/college-role-directory-model";
import {exportVisibleCollegePeople} from "@/modules/people/college-visible-directory-export";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:Request){
 try{
  const params=new URL(req.url).searchParams;
  const kind=params.get("kind");
  if(kind!=="FACULTY"&&kind!=="LEARNER")
   return NextResponse.json({error:"INVALID_DIRECTORY_KIND"},{status:400});
  const raw=Object.fromEntries([...params].filter(([key])=>key!=="kind"));
  const parsed=collegeRoleDirectoryQuerySchema.safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:"INVALID_DIRECTORY_FILTERS"},{status:400});
  const data=await exportVisibleCollegePeople(await getCurrentRequestContext(),kind,parsed.data);
  const name=kind==="FACULTY"?"faculty.csv":"students.csv";
  return new Response(data.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="'+name+'"',
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
   "X-Export-Page":String(data.page),"X-Export-Count":String(data.shown),
  }});
 }catch(e){return apiErrorResponse(e);}
}
