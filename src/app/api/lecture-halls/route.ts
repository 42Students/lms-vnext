import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
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

import { CACHE, privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const search=new URL(request.url).searchParams;
const legacy=search.get("legacy")==="1";
const stats=search.get("stats")==="1";
const responseOptions = { headers: { "Cache-Control": CACHE.PRIVATE } };
const collegeId = search.get("collegeId");
if (stats) {
      return NextResponse.json(await getLectureHallStatistics(context, collegeId ?? ""), responseOptions);
    }
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
if(search.has("deptId")&&!params["departmentId"])params["departmentId"]=search.get("deptId")??"";
if(search.has("hallId")&&!params["id"])params["id"]=search.get("hallId")??"";
const result=await listLectureHalls(context,params);
if(legacy)return NextResponse.json({status:"success",message:"Lecture halls retrieved",
      data:result.items,total:result.pagination.total,
      pagination:result.pagination,collegeId:result.collegeId},
     {headers:{"Cache-Control":CACHE.PRIVATE}});
return privateJson(result);
} catch (error) {
    if (error instanceof LectureHallError) return lectureHallErrorResponse(error);
    return apiErrorResponse(error);
  }
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
let body: unknown;
try {
      body = await boundedRequestJson(request);
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
  },
);
