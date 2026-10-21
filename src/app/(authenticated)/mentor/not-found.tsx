import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

/** In the authenticated shell, errors use its single white page canvas.
 * Do not redirect all unknown mentor paths: only the legacy bookmarked dynamic
 * /mentor/courses/[courseId] route redirects silently to /mentor/projects.
 * A future dynamic page.tsx owns that redirect; all other 404s remain real.
 */
export default function NotFound() {
  return <section className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Page not found" />
    <p className="text-sm text-body">This page may have moved or is no longer available. Please return home.</p>
    <Link href="/mentor" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Go to home</Link>
  </section>;
}
