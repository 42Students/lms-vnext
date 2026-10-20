"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Archived company relationships" />
    <ErrorState title="Couldn't load archived relationships"
      description="The database could not be read. No empty list is inferred."
      action={<>
        <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
        <Link href="/tpo/companies" className="lms-inline-link inline-flex min-h-11 items-center px-3 font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">← Companies directory</Link>
      </>}
    />
  </div>;
}
