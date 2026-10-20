"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function FacultyContactsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title={"Couldn't load contacts"} />
      <p className="max-w-xl text-sm leading-6 text-body">
        The college directory request failed. Retry instead of treating the directory as empty.
      </p>
      <Button onClick={reset}>Retry</Button>
    </section>
  );
}
