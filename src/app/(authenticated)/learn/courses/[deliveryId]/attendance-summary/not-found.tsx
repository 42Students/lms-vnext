import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";

export default function LearnerCourseAttendanceHistoryNotFound() {
  return (
    <div className="min-w-0 space-y-4">
      <PageHeader title="Course attendance history unavailable" />
      <Alert tone="warning">This course or its attendance history is not available to your current enrollment.</Alert>
      <Link href="/learn/courses" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-[var(--lms-primary)] hover:bg-primary-subtle hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">
        Back to Courses
      </Link>
    </div>
  );
}
