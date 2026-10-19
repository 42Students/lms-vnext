"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="border-b border-border py-6">
      <PageHeader title={"Couldn't load Reports · Placement Summary"} />
      <p className="mt-2 text-sm text-body">
        The requested records could not be retrieved. A load failure does not
        mean there are no records or that a reported total is zero.
      </p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </section>
  );
}
