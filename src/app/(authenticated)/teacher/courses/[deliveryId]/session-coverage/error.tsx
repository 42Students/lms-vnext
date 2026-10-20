"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title="Attendance session coverage could not load" />
    <p className="max-w-prose text-sm leading-6 text-body">The read failed. Missing results are not assumed to be zero.</p>
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
      <Button type="button" variant="primary" onClick={reset} className="w-full sm:w-auto">Retry</Button>
      <Link href="/teacher/courses" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Courses</Link>
    </div>
  </section>;
}
