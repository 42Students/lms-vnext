import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerCourseProgressNotFound() {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Course progress unavailable" />
      <Alert tone="warning">The course or its learning path is unavailable for your current enrollment.</Alert>
      <ButtonLink variant="secondary" href="/learn/courses" className="w-full sm:w-auto">Back to Courses</ButtonLink>
    </section>
  );
}
