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
    const params = Object.fromEntries(new URL(request.url).searchParams);
    return NextResponse.json(await listLectureHalls(context, params));
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
