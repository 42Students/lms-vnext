import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
export default function NotFound() {
 return <section className="min-w-0 space-y-4">
  <PageHeader title="Response follow-ups unavailable" />
  <p className="max-w-prose text-sm leading-6 text-body">These follow-ups may have moved or are no longer available.</p>
  <Link href="/teacher/results" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Results overview</Link>
 </section>;
}
