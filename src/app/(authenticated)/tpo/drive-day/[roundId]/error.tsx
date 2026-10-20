"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Drive Day round" />
    <ErrorState title="Couldn't load this Drive Day round"
      description="The round roster and progress could not be retrieved. No empty roster or result count has been inferred from this failure."
      action={<>
        <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/tpo/drive-day" className="lms-inline-link inline-flex min-h-11 items-center px-3 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Drive Day</Link>
      </>}
    />
  </div>;
}
