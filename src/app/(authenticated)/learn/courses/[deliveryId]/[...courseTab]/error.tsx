"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

/** Recover a transient course read without exposing inaccessible course data. */
export default function CourseError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const attendance = pathname.includes("/attendanceDetail");
  const syllabus = pathname.includes("/roadmap");
  return <section className="min-w-0 space-y-4">
    <PageHeader title={attendance ? "Attendance" : syllabus ? "Lesson content" : "Course unavailable"} />
    <Alert tone="error">
      <p>{attendance ? "Failed to load attendance." : syllabus ? "Lesson content could not be loaded" : "Could not load course"}</p>
      {syllabus?<p className="mt-1 text-sm text-body">Could not load lesson content. Your progress has not been changed. Retry to get the latest content and completion state.</p>:null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={reset}>
          {attendance || syllabus ? "Retry" : "Try again"}
        </Button>
        <Link href="/learn/courses" className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text underline">
          Back to courses
        </Link>
      </div>
    </Alert>
  </section>;
}
