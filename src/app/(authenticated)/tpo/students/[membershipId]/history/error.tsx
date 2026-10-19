"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ErrorView({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="border-b border-border py-6">
      <PageHeader title={"Couldn't load student placement history"} />
      <p className="mt-2 text-sm text-body">
        The records could not be retrieved. No missing record or zero count is inferred.
      </p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </section>
  );
}
