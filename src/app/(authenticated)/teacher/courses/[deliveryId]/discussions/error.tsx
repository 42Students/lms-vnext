"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function FacultyCourseDiscussionsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 border-b border-border bg-transparent py-[var(--lms-space-5)]">
      <PageHeader title={"Couldn&apos;t load discussions"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Course discussion access could not be loaded. Retry instead of treating this as an empty conversation.
      </p>
      <Button variant="secondary" className="mt-5" onClick={reset}>Retry</Button>
    </section>
  );
}
