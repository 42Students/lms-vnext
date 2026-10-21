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
  return <section className="min-w-0 space-y-4">
    <PageHeader title={attendance ? "Attendance" : "Course unavailable"} />
    <Alert tone="error">
      <p>{attendance ? "Failed to load attendance." : "Could not load course"}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={reset}>
          {attendance ? "Retry" : "Try again"}
        </Button>
        <Link href="/learn/courses" className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text underline">
          Back to courses
        </Link>
      </div>
    </Alert>
  </section>;
}
