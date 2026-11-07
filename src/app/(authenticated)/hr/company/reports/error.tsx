"use client";

import { TextLink } from "@/components/ui/text-link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Company Reports" />
    <ErrorState title="Hiring reports unavailable"
      description="Hiring report records could not be retrieved for your selected college. This error does not establish that there are zero applications, drives or offers."
      action={<span className="inline-flex min-w-0 flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><TextLink href="/hr/company" className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9">Back to Company & Team</TextLink></span>}/>
  </div>;
}
