"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="border-b border-border bg-transparent py-6">
      <h1 className="text-lg font-semibold text-foreground">
        Couldn&apos;t load drive shortlist
      </h1>
      <p className="mt-2 text-sm text-body">
        The persisted screening shortlist could not be retrieved. This is not
        evidence of zero shortlisted applicants. Use Retry to load the current view.
      </p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </section>
  );
}
