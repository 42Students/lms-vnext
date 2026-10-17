"use client";

import { CollegeTabError } from "@/components/courses/college-tab-error";

export default function CollegeAssignmentsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <CollegeTabError tab="assignments" reset={reset} />;
}
