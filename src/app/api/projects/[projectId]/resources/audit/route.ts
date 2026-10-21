import {NextResponse} from "next/server";
import {GET as getProjectResources} from "../route";

export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};

/** Legacy GET /{projectId}/resource-audit maps to the scoped resource
 * history reader. No legacy collegeId query may widen the active scope.
 * The shared reader enforces project access and returns 10 entries per page.
 */
export async function GET(request:Request,context:RouteContext){
 const original=new URL(request.url);
 if([...original.searchParams.keys()].some(key=>key!=="page"&&key!=="collegeId") ||
    original.searchParams.getAll("page").length>1 ||
    original.searchParams.getAll("collegeId").length>1)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 // The collegeId in old links is informational, never a scope override.
 // The caller must use the selected college/membership; a mismatched
 // legacy ID cannot be trusted to cross an authorization boundary.
 if(original.searchParams.has("collegeId"))
  return NextResponse.json({error:"INVALID_SCOPE",message:"Use the selected college workspace"},{status:400});
 original.searchParams.set("view","audit");
 return getProjectResources(new Request(original.toString(),{headers:request.headers}),context);
}
