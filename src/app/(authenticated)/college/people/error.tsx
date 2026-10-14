"use client";
import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
export default function CollegePeopleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="People directory unavailable"
    description="No membership data could be loaded. Retry or clear filters."
    action={<div className="flex flex-wrap gap-3">
      <button type="button" onClick={reset} className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Retry</button>
      <Link href="/college/people" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Clear filters</Link>
    </div>} />;
}
