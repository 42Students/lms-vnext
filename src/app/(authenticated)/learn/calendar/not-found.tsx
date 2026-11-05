import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function LearnerCalendarNotFound(){
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Page not found" />
    <p className="max-w-prose text-sm text-body">This page may have moved or is no longer available.</p>
    <ButtonLink variant="secondary" href="/learn/calendar" className="w-full sm:w-auto">Class Schedule</ButtonLink>
  </section>;
}
