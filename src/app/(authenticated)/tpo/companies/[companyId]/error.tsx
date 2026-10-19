"use client";

import { Button } from "@/components/ui/button";

export default function TpoCompanyDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface px-6 py-10 text-center"
    >
      <h1 className="text-lg font-semibold text-foreground">
        Couldn&apos;t load company detail
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Company contacts, drives and hiring history could
        not be retrieved. The failure is not represented
        as an empty company record.
      </p>
      <Button className="mt-5" onClick={reset}>
        Retry
      </Button>
    </section>
  );
}
