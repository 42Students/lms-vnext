import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  LectureHallError,
  createLectureHall,
  listLectureHalls,
} from "@/modules/academics/lecture-hall-service";
import { lectureHallErrorResponse } from "./error-response";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const search=new URL(request.url).searchParams;
    const legacy=search.get("legacy")==="1";
    const stats=search.get("stats")==="1";
    const params=Object.fromEntries([...search].filter(([key])=>
      !["legacy","stats","deptId","hallId"].includes(key)));
    if(search.has("deptId")&&!params.departmentId)params.departmentId=search.get("deptId")??"";
    if(search.has("hallId")&&!params.id)params.id=search.get("hallId")??"";
    const result=await listLectureHalls(context,params);
    if(stats)return NextResponse.json({status:"success",message:"Lecture hall stats retrieved",
      data:{total:result.pagination.total,displayed:result.items.length},
    },{headers:{"Cache-Control":"private, no-store"}});
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
      { hall: await createLectureHall(context, body) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof LectureHallError) return lectureHallErrorResponse(error);
    return apiErrorResponse(error);
  }
}
