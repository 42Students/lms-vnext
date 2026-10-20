import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Course content not found" />
    <p className="max-w-xl text-sm leading-6 text-body">
      This lesson or course content is not available in your current teaching Section.
    </p>
    <Link href="/teacher/courses" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">
      Back to courses
    </Link>
  </section>;
}
