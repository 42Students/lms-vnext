import { PageBackLink } from "@/components/ui/page-back-link";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return <section className="min-w-0 space-y-5">
    <PageHeader title="Page not found" />
    <p className="text-sm text-body">This page may have moved or is no longer available. Please return home.</p>
    <PageBackLink href="/hr" label="Go to home"/>
  </section>;
}
