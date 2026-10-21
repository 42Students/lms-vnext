import { NextResponse } from "next/server";
import type { LectureHallError } from "@/modules/academics/lecture-hall-service";

const STATUS = {
  COLLEGE_NOT_FOUND: 404,
  HALL_NOT_FOUND: 404,
  DEPARTMENT_NOT_FOUND: 400,
  HALL_NAME_TAKEN: 409,
  HALL_IN_USE: 409,
  HALL_CAPACITY_CONFLICT: 409,
} as const;

export function lectureHallErrorResponse(error: LectureHallError) {
  return NextResponse.json(
    { error: error.code, ...(error.detail ?? {}),
      ...(error.code === "HALL_NOT_FOUND" ? {message:"Lecture hall not found"} : {}) },
    { status: STATUS[error.code] },
  );
}
