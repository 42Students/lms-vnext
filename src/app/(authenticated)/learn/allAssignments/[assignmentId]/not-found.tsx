import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

/** The learner's missing assignment resolves back to their assignment list. */
export default function LearnerAssignmentNotFound() {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Page not found" />
    <p className="max-w-prose text-sm text-body">This page may have moved or is no longer available. Please return home.</p>
    <Link href="/learn/allAssignments"
      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">← All Assignments</Link>
  </section>;
}
