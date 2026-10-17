"use client";

import { CollegeTabError } from "@/components/courses/college-tab-error";

export default function CollegeLiveClassesError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <CollegeTabError tab="live-classes" reset={reset} />;
}
