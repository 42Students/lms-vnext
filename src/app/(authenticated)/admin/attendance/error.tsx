"use client";

import { Button } from "@/components/ui/button";

export default function SuperAdminAttendanceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="border-l-2 border-error px-5 py-8 text-center">
      <h1 className="text-lg font-semibold text-foreground">Couldn&apos;t load scoped attendance</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        The selected college attendance request failed. Retry without changing the safety scope.
      </p>
      <Button className="mt-5" onClick={reset}>Retry</Button>
    </section>
  );
}
