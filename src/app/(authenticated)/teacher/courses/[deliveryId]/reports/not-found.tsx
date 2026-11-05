import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Section reports unavailable" />
    <p className="max-w-prose text-sm leading-6 text-body">This Section may have moved or is no longer available.</p>
    <ButtonLink variant="secondary" href="/teacher/courses" className="w-full sm:w-auto">Courses</ButtonLink>
  </section>;
}
