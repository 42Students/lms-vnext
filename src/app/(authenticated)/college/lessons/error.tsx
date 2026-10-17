"use client";

import { CollegeTabError } from "@/components/courses/college-tab-error";

export default function CollegeLessonsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <CollegeTabError tab="lessons" reset={reset} />;
}
