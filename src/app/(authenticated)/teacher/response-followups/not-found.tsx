import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function NotFound() {
 return <section className="min-w-0 space-y-4">
  <PageHeader title="Response follow-ups unavailable" />
  <p className="max-w-prose text-sm leading-6 text-body">These follow-ups may have moved or are no longer available.</p>
  <ButtonLink variant="secondary" href="/teacher/results" className="w-full sm:w-auto">Results overview</ButtonLink>
 </section>;
}
