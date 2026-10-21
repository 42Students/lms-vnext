import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { SessionAuthenticationError } from "@/auth/session";
import { isSuperAdmin } from "@/modules/identity/context";
import { listColleges } from "@/modules/colleges/service";
import { isSameOriginRequest } from "@/auth/origin";
import {
  createDepartment,
  listDepartments,
  fetchPagedDepartments,
} from "@/modules/departments/service";
import { apiErrorResponse } from "@/lib/api-error";

export const runtime = "nodejs";
/** Legacy transport map: /api/v1/department/fetch?collegeId -> GET,
 * /fetchAll -> GET (verified Super Admin only), /fetchPaged?page&size
 * -> GET ?page&size (0-based, size 1..100, default20), /create -> POST.
 * CORS wildcard credentials are intentionally not carried over: same-origin
 * request/session/role checks protect cross-college membership data.
 */

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].some(key => query.getAll(key).length > 1))
      return NextResponse.json({ error: "INVALID_FILTERS", message: "Provide one college or organization scope." }, { status: 400 });
    // Old fetchPaged returned page/content/totalElements/first/last; preserve
    // the envelope only when page/size is explicitly requested. Default GET
    // retains the existing {departments} full-list response for vNext callers.
    if(query.has("page")||query.has("size")){
      const page=await fetchPagedDepartments(context,{
        collegeId:query.get("collegeId")||undefined,
        page:query.get("page")??"0",
        size:query.get("size")??"20",
      });
      return NextResponse.json({
        status:"OK",message:"OK",data:page.content,departments:page.content,
        ...page,
      },{headers:{"Cache-Control":"private, no-store"}});
    }
    const collegeId = query.get("collegeId") || context.adminScope?.collegeId ||
      context.membership?.collegeId || "";
    if (!collegeId && isSuperAdmin(context)) {
      // Legacy fetchAll is allowed only for the platform administrator. Each
      // college is still read through the central scoped permission service.
      const colleges = await listColleges(context, query.get("organizationId"));
      const inventories = await Promise.all(colleges.map(college => listDepartments(context,college.id)));
      const items = inventories.flat();
      return NextResponse.json({ status: "OK", message: "OK", data: items, departments: items },
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if(!collegeId){
      // No actor-owned selected college: return an empty directory, never
      // guess the tenant or expose a cross-college roster.
      return NextResponse.json({status:"OK",message:"OK",data:[],departments:[]},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    const items = await listDepartments(context, collegeId);
    return NextResponse.json({ status: "OK", message: "OK", data: items, departments: items },
      {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    if (error instanceof SessionAuthenticationError)
      return NextResponse.json({ error: "UNAUTHENTICATED", message: "Authentication required" }, { status: 401 });
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const department = await createDepartment(
      context,
      body as {
        collegeId: string;
        name: string;
      },
    );

    return NextResponse.json(
      { status: "OK", message: "OK", data: department, department },
      { status: 200 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
