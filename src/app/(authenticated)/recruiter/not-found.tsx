import { PageBackLink } from "@/components/ui/page-back-link";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return <div className="min-w-0 max-w-2xl space-y-4">
    <PageHeader title="Page not found" />
    <p className="break-words text-sm leading-6 text-body">This page may have moved or is no longer available. Please return home.</p>
    <PageBackLink href="/hr/home" label="Go to home" />
  </div>;
}
