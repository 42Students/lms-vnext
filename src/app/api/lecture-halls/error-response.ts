import { NextResponse } from "next/server";
import { statusForCode } from "@/lib/error-registry";
import type { LectureHallError } from "@/modules/academics/lecture-hall-service";

export function lectureHallErrorResponse(error: LectureHallError) {
  return NextResponse.json(
    { error: error.code, ...(error.detail ?? {}),
      ...(error.code === "HALL_NOT_FOUND" ? {message:"Lecture hall not found"} : {}) },
    { status: statusForCode("lectureHall", error.code) },
  );
}
