import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Page not found" />
    <p className="text-sm text-body">This page may have moved or is no longer available. Please return home.</p>
    <Link href="/tpo" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Go to home</Link>
  </section>;
}
