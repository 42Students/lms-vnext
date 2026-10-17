"use client";

import { CollegeTabError } from "@/components/courses/college-tab-error";

export default function CollegeQuizzesError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <CollegeTabError tab="quizzes" reset={reset} />;
}
