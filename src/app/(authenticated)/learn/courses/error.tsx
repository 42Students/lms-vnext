"use client";
import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";

import { Button } from "@/components/ui/button";
import {usePathname} from "next/navigation";
import Link from "next/link";

export default function LearnerCoursesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname=usePathname();
  const isList=pathname==="/learn/courses";
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center">
      <h1 className="m-0 text-xl font-semibold text-foreground">
        {isList?"Courses could not be loaded":"Could not load course"}
      </h1>
      <p className="mt-2 text-sm text-body">
        {isList?"This is a loading problem, not an empty course list. Check your connection and try again.":"This course may be unavailable, or the request may have failed. Try again or return to Courses."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/learn/courses"
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground"
        >
          {LEARNER_BACK_TO_COURSES}
        </Link>
      </div>
    </div>
  );
}
