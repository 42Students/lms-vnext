import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listCollegeStudentImportHistory} from "@/modules/people/college-import-history-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{const page=new URL(request.url).searchParams.get("page")??1;
 return NextResponse.json(await listCollegeStudentImportHistory(await getCurrentRequestContext(),page),
  {headers:{"Cache-Control":"private, no-store"}})}
 catch(error){return apiErrorResponse(error)}
}
