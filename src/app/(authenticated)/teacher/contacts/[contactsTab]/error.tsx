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
    <section className="min-w-0 border-b border-border bg-transparent py-[var(--lms-space-5)]">
      <PageHeader title={"Couldn&apos;t load contacts"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        The college directory request failed. Retry instead of treating the directory as empty.
      </p>
      <Button variant="secondary" className="mt-5" onClick={reset}>Retry</Button>
    </section>
  );
}
