"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Heading } from "@/components/ui/heading";

export default function CollegeClassesError({ error, reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  useEffect(() => { /* The error boundary does not display internal error details. */ }, [error]);
  return <section className="space-y-4">
    <PageHeader title="Classes & Sections" />
    <div role="alert" className="rounded-lg border border-[color:var(--lms-error-surface)] bg-[color:var(--lms-error-surface)] px-5 py-4">
      <Heading level={2}>Unable to load classes</Heading>
      <p className="mt-2 text-sm">The class list could not be read. Retry without losing your selected college.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={reset}>Retry</Button>
        <Link href="/college/classes" className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Clear filters</Link>
      </div>
    </div>
  </section>;
}
