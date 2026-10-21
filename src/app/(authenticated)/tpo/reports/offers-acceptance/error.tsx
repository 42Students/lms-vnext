"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="space-y-3 py-6">
      <PageHeader title={"Couldn't load Reports · Offers Acceptance"} />
      <p role="alert" className="mt-2 text-sm text-body">
        The requested records could not be retrieved. A load failure does not
        mean there are no records or that a reported total is zero.
      </p>
      <Button className="mt-4 min-h-11 w-full sm:w-auto sm:min-h-9" onClick={reset}>Retry</Button>
    </section>
  );
}
