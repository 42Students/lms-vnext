import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

/** In the authenticated shell, errors use its single white page canvas. */
export default function NotFound() {
  return <section className="min-w-0 space-y-4 break-words">
    <PageHeader title="Page not found" />
    <p className="text-sm text-body">This page may have moved or is no longer available. Please return home.</p>
    <ButtonLink variant="secondary" href="/teacher/courses" className="w-full sm:w-auto">Go to home</ButtonLink>
  </section>;
}
