import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";

export default function TeachingCourseNotFound() {
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="My Teaching Courses" />
    <ErrorState title="Course not found" description="This teaching course is unavailable or you no longer have permission to view it."
      action={<Link href="/teach/courses" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">My Teaching Courses</Link>}/>
  </div>;
}
