import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  LectureHallError,
  createLectureHall,
  listLectureHalls,
  searchLectureHallsForPicker,
  listLectureHallsLegacyPage,
  getLectureHallStatistics,
  normalizeLegacyLectureHallCreate,
} from "@/modules/academics/lecture-hall-service";
import { lectureHallErrorResponse } from "./error-response";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const search=new URL(request.url).searchParams;
    const legacy=search.get("legacy")==="1";
    const stats=search.get("stats")==="1";
    const responseOptions = { headers: { "Cache-Control": "private, no-store" } };
    const collegeId = search.get("collegeId");
    if (stats) {
      return NextResponse.json(await getLectureHallStatistics(context, collegeId ?? ""), responseOptions);
    }
    // Old query/limit autocomplete and 0-based page/size are explicit
    // adapters. UUID college scope remains mandatory; never accept numeric
    // legacy identities as a request-time tenant selector.
    if (legacy && search.has("query")) {
      return NextResponse.json(await searchLectureHallsForPicker(context, {
        collegeId,
        query: search.get("query") ?? "",
        ...(search.has("deptId") ? { deptId: search.get("deptId") } : {}),
        ...(search.has("limit") ? { limit: search.get("limit") } : {}),
        ...(search.has("roomType") ? { roomType: search.get("roomType") } : {}),
      }), responseOptions);
    }
    if (legacy && (search.has("page") || search.has("size"))) {
      return NextResponse.json(await listLectureHallsLegacyPage(context, {
        collegeId,
        ...(search.has("page") ? { page: search.get("page") } : {}),
        ...(search.has("size") ? { size: search.get("size") } : {}),
        ...(search.has("deptId") ? { deptId: search.get("deptId") } : {}),
        ...(search.has("query") ? { query: search.get("query") } : {}),
      }), responseOptions);
    }
    const params=Object.fromEntries([...search].filter(([key])=>
      !["legacy","stats","deptId","hallId"].includes(key)));
    if(search.has("deptId")&&!params.departmentId)params.departmentId=search.get("deptId")??"";
    if(search.has("hallId")&&!params.id)params.id=search.get("hallId")??"";
    const result=await listLectureHalls(context,params);

    if(legacy)return NextResponse.json({status:"success",message:"Lecture halls retrieved",
      data:result.items,total:result.pagination.total,
      pagination:result.pagination,collegeId:result.collegeId},
     {headers:{"Cache-Control":"private, no-store"}});
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    if (error instanceof LectureHallError) return lectureHallErrorResponse(error);
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }
    return NextResponse.json(
      { hall: await createLectureHall(context,
          new URL(request.url).searchParams.get("legacy") === "1"
            ? normalizeLegacyLectureHallCreate(body) : body) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof LectureHallError) return lectureHallErrorResponse(error);
    return apiErrorResponse(error);
  }
}
