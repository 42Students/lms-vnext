"use client";

import { CollegeTabError } from "@/components/courses/college-tab-error";

export default function CollegeCourseProgressError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <CollegeTabError tab="course-progress" reset={reset} />;
}
