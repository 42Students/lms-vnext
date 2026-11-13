import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listCollegeStudentImportHistory} from "@/modules/people/college-import-history-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const page=new URL(request.url).searchParams.get("page")??1;
    return NextResponse.json(await listCollegeStudentImportHistory(__ctx,page),
  {headers:{"Cache-Control":CACHE.PRIVATE}})
  },
);
