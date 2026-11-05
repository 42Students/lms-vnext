import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function NotFound() {
 return <section className="min-w-0 space-y-4">
 <PageHeader title="Assessment results unavailable" />
 <p className="max-w-prose text-sm leading-6 text-body">These results may have moved or are no longer available in your Sections.</p>
 <ButtonLink variant="secondary" href="/teacher/courses" className="w-full sm:w-auto">Courses</ButtonLink>
 </section>;
}
