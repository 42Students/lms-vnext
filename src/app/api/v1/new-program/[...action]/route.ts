import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { GET as canonicalGet, POST as canonicalPost } from "@/app/api/academics/programs/route";
import {
  GET as canonicalGetDetail, PATCH as canonicalPatch, DELETE as canonicalDelete,
} from "@/app/api/academics/programs/[programId]/route";
import { listPrograms } from "@/modules/academics/program-service";

export const runtime = "nodejs";
type Context = { params: Promise<{ action: string[] }> };
const uuid = z.string().uuid();

/** Translation boundary for old v1 program CRUD. Historical integer IDs are
 * not authorization identifiers; old clients must supply verified UUIDs
 * after a college-scoped lookup. Writes keep the current request-origin guard
 * and vNext's soft-archive and academic dependency protections. */
export async function GET(request: Request, { params }: Context) {
  const { action } = await params;
  const [operation, id] = action;
  const url = new URL(request.url);
  try {
    if (["fetchByCollege","fetchAll","fetchAllPrograms","getProgramsByCollege"].includes(operation ?? "") &&
      action.length === 1) {
      const context = await getCurrentRequestContext();
      const collegeId = url.searchParams.get("collegeId");
      const programs = await listPrograms(context,uuid.parse(collegeId),
        url.searchParams.get("departmentId") ?? url.searchParams.get("deptId"));
      return NextResponse.json({status:"success",message:"Programs retrieved",data:programs},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if (["fetchById","findById","fetchProgramDetails"].includes(operation ?? "") &&
      action.length === 2 && uuid.safeParse(id).success) {
      const response = await canonicalGetDetail(request,{params:Promise.resolve({programId:id!})});
      if (!response.ok) return response;
      const body = await response.json() as {program:unknown};
      return NextResponse.json({status:"success",message:"Program retrieved",data:body.program},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if (operation === "fetchPaged" && action.length === 1) {
      url.searchParams.set("page",url.searchParams.get("page") ?? "0");
      url.searchParams.set("size",url.searchParams.get("size") ?? "20");
      return canonicalGet(new Request(url,{method:"GET",headers:request.headers,signal:request.signal}));
    }
    return NextResponse.json({error:"NOT_FOUND"},{status:404});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  const { action } = await params;
  if (action.length !== 1 || action[0] !== "create")
    return NextResponse.json({error:"NOT_FOUND"},{status:404});
  const url = new URL(request.url);
  url.searchParams.set("legacy","1");
  return canonicalPost(new Request(url,request));
}

export async function PUT(request: Request, { params }: Context) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  const { action } = await params;
  const [operation,id] = action;
  if (operation !== "update" || action.length !== 2 || !uuid.safeParse(id).success)
    return NextResponse.json({error:"NOT_FOUND"},{status:404});
  try {
    const body = z.record(z.string(),z.unknown()).parse(await request.json());
    const currentResponse = await canonicalGetDetail(request,{
      params:Promise.resolve({programId:id!}),
    });
    if (!currentResponse.ok) return currentResponse;
    const current = (await currentResponse.json() as {
      program:{name:string;code:string;durationTerms:number;departmentId:string};
    }).program;
    const rawYears = body.durationYears ?? body.duration_years;
    const durationTerms = body.durationTerms ??
      (rawYears === undefined ? current.durationTerms : Number(rawYears)*2);
    const payload = {
      name: body.name ?? current.name,
      code: body.code ?? current.code,
      departmentId: body.departmentId ?? body.dept_id ?? body.deptId ?? current.departmentId,
      durationTerms,
    };
    return canonicalPatch(new Request(request.url,{
      method:"PATCH",headers:request.headers,body:JSON.stringify(payload),
    }),{params:Promise.resolve({programId:id!})});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  const { action } = await params;
  const [operation,id] = action;
  if (operation !== "delete" || action.length !== 2 || !uuid.safeParse(id).success)
    return NextResponse.json({error:"NOT_FOUND"},{status:404});
  return canonicalDelete(new Request(request.url,{
    method:"DELETE",headers:request.headers,body:JSON.stringify({confirm:true}),
  }),{params:Promise.resolve({programId:id!})});
}
