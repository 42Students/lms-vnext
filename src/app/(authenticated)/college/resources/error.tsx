"use client";

import { CollegeTabError } from "@/components/courses/college-tab-error";

export default function CollegeResourcesError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <CollegeTabError tab="resources" reset={reset} />;
}
