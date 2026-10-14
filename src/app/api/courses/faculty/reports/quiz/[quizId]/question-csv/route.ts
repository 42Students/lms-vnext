import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getFacultyQuizQuestionCsvForDownload} from "@/modules/courses/faculty-quiz-question-csv-service";
import {facultyCsvAttachmentHeaders} from "@/modules/courses/faculty-report-csv-request";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type RouteContext={params:Promise<{quizId:string}>};

export async function GET(request:Request,{params}:RouteContext){
 try{
  const {quizId}=await params;
  const url=new URL(request.url);
  const raw=Object.fromEntries(url.searchParams.entries());
  const query=z.object({deliveryId:z.string().uuid()}).strict().parse(raw);
  if(url.searchParams.getAll("deliveryId").length!==1){
   z.string().uuid().parse(null);
  }
  const result=await getFacultyQuizQuestionCsvForDownload(
   await getCurrentRequestContext(),
   {quizId,deliveryId:query.deliveryId},
  );
  const headers=new Headers(facultyCsvAttachmentHeaders(result.filename));
  headers.set("X-Export-Truncated",result.omittedRows>0?"true":"false");
  headers.set("X-Export-Omitted-Rows",String(result.omittedRows));
  return new Response("\uFEFF"+result.csv,{status:200,headers});
 }catch(error){return apiErrorResponse(error)}
}
