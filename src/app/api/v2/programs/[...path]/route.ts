import { NextResponse } from "next/server";
import { z } from "zod";
import { GET as getCanonicalPrograms } from "@/app/api/academics/programs/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { listPrograms } from "@/modules/academics/program-service";
import { recordScopedProgramSelection } from "@/modules/academics/legacy-program-popularity";

export const runtime = "nodejs";
type Context = { params: Promise<{ path: string[] }> };
const uuid = z.string().uuid();

/** Explicit migration aliases for the historical /api/v2/programs search
 * endpoints. The active college is always a verified UUID; legacy numeric
 * departments are never inferred from a different tenant's records.
 * Global-mode access remains behind the vNext acting-college selection. */
export async function GET(request: Request, { params }: Context) {
  const { path } = await params;
  const [kind, qualifier] = path;
  const url = new URL(request.url);
  if (!url.searchParams.has("collegeId")) {
    return NextResponse.json({
      status: "error",
      message: "Select a college first; collegeId is required (or use a Super Admin acting college).",
      data: null,
    }, { status: 400 });
  }
  switch (kind) {
    case "search":
    case "popular":
    case "stats":
    case "categories":
      if (qualifier) return NextResponse.json({error:"INVALID_ROUTE"},{status:404});
      url.searchParams.set("mode", kind);
      break;
    case "department":
      if (!qualifier || !uuid.safeParse(qualifier).success)
        return NextResponse.json({status:"error",message:"Select a valid department.",data:null},{status:400});
      url.searchParams.set("mode", "department");
      url.searchParams.set("departmentId", qualifier);
      break;
    case "category":
      if (!qualifier) return NextResponse.json({status:"error",message:"Select a department.",data:null},{status:400});
      url.searchParams.set("mode","category");
      url.searchParams.set("department",qualifier);
      break;
    case "exists":
      if (!qualifier) return NextResponse.json({status:"error",message:"Program name is required.",data:null},{status:400});
      url.searchParams.set("mode","exists");
      url.searchParams.set("name",qualifier);
      break;
    default:
      return NextResponse.json({error:"NOT_FOUND"},{status:404});
  }
  return getCanonicalPrograms(new Request(url, {
    method:"GET",headers:request.headers,signal:request.signal,
  }));
}

/** The old cache recorded program selections only in JVM memory. A bounded
 * worker-local score preserves the ranking hint; no user-level tracking,
 * no cross-college counter, and no durable enrollment side effect. */
export async function POST(request: Request, { params }: Context) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  }
  const { path } = await params;
  const [first, second] = path;
  if (first === "refresh" && !second) {
    return NextResponse.json({status:"success",message:"Programs read from current storage",data:null});
  }
  if (second !== "select" || path.length !== 2 || !uuid.safeParse(first).success)
    return NextResponse.json({error:"NOT_FOUND"},{status:404});
  try {
    const context = await getCurrentRequestContext();
    const collegeId = uuid.parse(new URL(request.url).searchParams.get("collegeId"));
    const programs = await listPrograms(context,collegeId);
    if (!programs.some(program => program.id === first))
      return NextResponse.json({status:"error",message:"Program not found",data:null},{status:404});
    recordScopedProgramSelection(collegeId,first!);
    return NextResponse.json({status:"success",message:"Selection recorded",data:null});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
