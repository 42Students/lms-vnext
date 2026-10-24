import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {mentorUnifiedSearchQuery,searchMentorWorkspace}
  from "@/modules/projects/mentor-unified-search-service";

export const runtime="nodejs";
export async function GET(request:Request){
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
      headers:{"Cache-Control":"private, no-store"},
    });
  }catch(error){return apiErrorResponse(error);}
}
