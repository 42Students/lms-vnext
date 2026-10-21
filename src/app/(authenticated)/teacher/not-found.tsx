import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

/** In the authenticated shell, errors use its single white page canvas. */
export default function NotFound() {
  return <section className="min-w-0 space-y-4 break-words">
    <PageHeader title="Page not found" />
    <p className="text-sm text-body">This page may have moved or is no longer available. Please return home.</p>
    <Link href="/teacher/courses" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Go to home</Link>
  </section>;
}
