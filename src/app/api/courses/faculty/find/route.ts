import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {searchFacultyWorkspace} from "@/modules/courses/faculty-find-service";
import { route } from "@/security/route";

import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
/** Faculty prototype search results are authorized on every request and
 * cannot be cached across colleges, roles or users. */
async function handleGET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const terms=params.getAll("q");
  if(terms.length!==1||[...params.keys()].some(key=>key!=="q")||
    terms[0]!.trim().length<2||terms[0]!.trim().length>100)
   return NextResponse.json({error:"INVALID_SEARCH"},{status:400,
    headers:{"Cache-Control":CACHE.PRIVATE}});
  const context=await getCurrentRequestContext();
  const results=await searchFacultyWorkspace(context,terms[0]!);
  return privateJson({results});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["q"] },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
