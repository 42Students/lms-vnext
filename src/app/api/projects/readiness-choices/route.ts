import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listCollegeReadinessWorkspaceChoicePage}
 from "@/modules/projects/college-readiness-releases-service";
import {z} from "zod";
export const runtime="nodejs";
const schema=z.strictObject({
 collegeId:z.string().uuid(),q:z.string().trim().max(120).default(""),
 page:z.string().regex(/^[1-9][0-9]{0,5}$/).transform(Number)
  .pipe(z.number().int().min(1).max(100000)).default(1),
});
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  if([...url.searchParams.keys()].some(k=>!["collegeId","q","page"].includes(k))||
     [...url.searchParams.keys()].some(k=>url.searchParams.getAll(k).length!==1)){
    return NextResponse.json({error:"INVALID_FILTERS"},{status:400});
  }
  const values=schema.parse({
   collegeId:url.searchParams.get("collegeId"),
   q:url.searchParams.get("q")??"",
   page:url.searchParams.get("page")??undefined,
  });
  const result=await listCollegeReadinessWorkspaceChoicePage(
   await getCurrentRequestContext(),values.collegeId,
   {page:values.page,search:values.q});
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
