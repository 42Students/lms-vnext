import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {searchFacultyWorkspace} from "@/modules/courses/faculty-find-service";

export const runtime="nodejs";
/** Faculty prototype search results are authorized on every request and
 * cannot be cached across colleges, roles or users. */
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const terms=params.getAll("q");
  if(terms.length!==1||[...params.keys()].some(key=>key!=="q")||
    terms[0]!.trim().length<2||terms[0]!.trim().length>100)
   return NextResponse.json({error:"INVALID_SEARCH"},{status:400,
    headers:{"Cache-Control":"private, no-store"}});
  const context=await getCurrentRequestContext();
  const results=await searchFacultyWorkspace(context,terms[0]!);
  return NextResponse.json({results},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
