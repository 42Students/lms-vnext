"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Actor and entity audit" />
    <ErrorState
      title="Couldn't load actor audit"
      description="Recorded activity could not be retrieved; no zero count is inferred."
      action={<>
        <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/tpo/audit"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          ← All audit sources
        </Link>
      </>}
    />
  </div>;
}
