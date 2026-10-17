"use client";

import { CollegeTabError } from "@/components/courses/college-tab-error";

export default function CollegeVideosError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <CollegeTabError tab="videos" reset={reset} />;
}
