"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Drive day" />
    <ErrorState title="Couldn't load Drive Day"
      description="The requested records could not be retrieved. A load failure does not mean there are no records or that a reported total is zero."
      action={<><Button type="button" variant="secondary" onClick={reset}>Retry</Button><TextLink href="/tpo/placements" className="inline-flex min-h-11 items-center px-3 md:min-h-9">Placements</TextLink></>}
    />
  </div>;
}
