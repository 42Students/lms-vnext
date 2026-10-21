"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function CollegeClassesError({ error, reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  useEffect(() => { /* The error boundary does not display internal error details. */ }, [error]);
  return <section className="space-y-4">
    <PageHeader title="Classes & Sections" />
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
      <h2 className="font-semibold">Unable to load classes</h2>
      <p className="mt-2 text-sm">The class list could not be read. Retry without losing your selected college.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={reset}>Retry</Button>
        <Link href="/college/classes" className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Clear filters</Link>
      </div>
    </div>
  </section>;
}
