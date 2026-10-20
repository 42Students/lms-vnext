"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Drive day" />
    <ErrorState title="Couldn't load Drive Day"
      description="The requested records could not be retrieved. A load failure does not mean there are no records or that a reported total is zero."
      action={<><Button type="button" variant="secondary" onClick={reset}>Retry</Button><Link href="/tpo/placements" className="lms-inline-link inline-flex min-h-11 items-center px-3 font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Placements</Link></>}
    />
  </div>;
}
