import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {mentorUnifiedSearchQuery,searchMentorWorkspace}
  from "@/modules/projects/mentor-unified-search-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
async function handleGET(request:Request){
  try{
    const query=new URL(request.url).searchParams;
    if([...query.keys()].some(key=>key!=="q")||query.getAll("q").length!==1){
      return NextResponse.json({error:"INVALID_SEARCH"},{status:400});
    }
    const parsed=mentorUnifiedSearchQuery.safeParse(query.get("q"));
    if(!parsed.success)
      return NextResponse.json({error:"INVALID_SEARCH"},{status:400});
    const results=await searchMentorWorkspace(
      await getCurrentRequestContext(),parsed.data);
    return NextResponse.json({results},{
      headers:{"Cache-Control":CACHE.PRIVATE},
    });
  }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced", repeatableQuery: ["q"] },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
