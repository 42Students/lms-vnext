import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Course content not found" />
    <p className="max-w-xl text-sm leading-6 text-body">
      This lesson or course content is not available in your current teaching Section.
    </p>
    <ButtonLink variant="secondary" href="/teacher/courses" className="w-full sm:w-auto">
      Back to courses
    </ButtonLink>
  </section>;
}
