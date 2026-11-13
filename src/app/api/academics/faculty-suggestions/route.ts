import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {isSuperAdmin} from "@/modules/identity/context";
import {listPopularCollegeFaculty,searchCollegeFacultySuggestions}
 from "@/modules/courses/college-faculty-picker-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Read-only replacement for legacy faculty search, college and popular
 * pickers. Caller scope comes only from the authenticated role switcher.
 * Management directories retain their separate, paginated read endpoint.
 */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const collegeId=isSuperAdmin(context)?context.adminScope?.collegeId:context.membership?.collegeId;
    if(!collegeId)return NextResponse.json({error:"COLLEGE_SCOPE_REQUIRED"},{status:403});
    const params=new URL(request.url).searchParams;
    const mode=params.get("mode")??"search";
    if(mode!=="search"&&mode!=="popular")
   return NextResponse.json({error:"INVALID_FACULTY_MODE"},{status:400});
    const result=mode==="popular"
   ?await listPopularCollegeFaculty(context,collegeId,params.get("limit")??10)
   :await searchCollegeFacultySuggestions(context,collegeId,{
    q:params.get("q")??"",
    ...(params.has("limit")?{limit:params.get("limit")}:{}),
    ...(params.has("departmentId")?{departmentId:params.get("departmentId")}:{}),
    ...(params.has("employmentType")?{employmentType:params.get("employmentType")}:{}),
   });
    return privateJson(result);
  },
);
