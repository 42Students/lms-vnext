import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return <section className="min-w-0 space-y-5">
    <PageHeader title="Page not found" />
    <p className="text-sm text-body">This page may have moved or is no longer available. Please return home.</p>
    <Link href="/recruiter" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
      Go to home
    </Link>
  </section>;
}
