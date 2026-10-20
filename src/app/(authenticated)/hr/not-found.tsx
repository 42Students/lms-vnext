import { PageBackLink } from "@/components/ui/page-back-link";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return <>
    <PageHeader title="Page not found" />
    <section role="alert" className="min-w-0 space-y-[var(--lms-space-4)] py-[var(--lms-space-4)]">
      <p className="max-w-prose break-words text-sm leading-6 text-body">This page may have moved or is no longer available. Please return home.</p>
      <div className="flex min-w-0 items-center"><PageBackLink href="/hr" label="Go to home"/></div>
    </section>
  </>;
}
