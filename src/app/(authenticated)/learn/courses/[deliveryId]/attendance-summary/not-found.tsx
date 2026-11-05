import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerCourseAttendanceHistoryNotFound() {
  return (
    <div className="min-w-0 space-y-4">
      <PageHeader title="Course attendance history unavailable" />
      <Alert tone="warning">This course or its attendance history is not available to your current enrollment.</Alert>
      <ButtonLink variant="secondary" href="/learn/courses" className="w-full sm:w-auto">
        Back to Courses
      </ButtonLink>
    </div>
  );
}
