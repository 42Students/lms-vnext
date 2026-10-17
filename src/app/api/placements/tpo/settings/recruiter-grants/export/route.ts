import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {tpoRecruiterAccessQuerySchema} from "@/modules/placements/tpo-recruiter-access-model";
import {listTpoRecruiterAccess} from "@/modules/placements/tpo-recruiter-access-service";
import {tpoRecruiterGrantCsv} from "@/modules/placements/tpo-recruiter-grant-export-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const query=tpoRecruiterAccessQuerySchema.parse({
   status:params.get("status")??"ALL",q:params.get("q")??"",page:1,
  });
  const result=await listTpoRecruiterAccess(await getCurrentRequestContext(),query,{exportAll:true});
  return new Response("\uFEFF"+tpoRecruiterGrantCsv(result.items,result.truncated),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="recruiters.csv"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"},
  });
 }catch(error){return apiErrorResponse(error);}
}
