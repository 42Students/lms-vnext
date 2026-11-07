import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listCollegeInterviewerSuggestions} from "@/modules/placements/college-interviewer-suggestions-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const query=new URL(request.url).searchParams;
    const result=await listCollegeInterviewerSuggestions(
   __ctx,{
    q:query.get("q")??"",limit:query.get("limit")??15,
   });
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
