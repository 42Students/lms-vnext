"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Attendance session coverage could not load" />
    <p role="alert" className="max-w-prose text-sm leading-6 text-body">The read failed. Missing results are not assumed to be zero.</p>
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
      <Button type="button" variant="primary" onClick={reset} className="w-full sm:w-auto">Retry</Button>
      <ButtonLink variant="secondary" href="/teacher/courses" className="sm:w-auto">Courses</ButtonLink>
    </div>
  </section>;
}
