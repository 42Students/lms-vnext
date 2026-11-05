import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";

export default function TeachingCourseNotFound() {
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="My Teaching Courses" />
    <ErrorState title="Course not found" description="This teaching course is unavailable or you no longer have permission to view it."
      action={<TextLink href="/teach/courses" className="inline-flex min-h-11 items-center md:min-h-9">My Teaching Courses</TextLink>}/>
  </div>;
}
