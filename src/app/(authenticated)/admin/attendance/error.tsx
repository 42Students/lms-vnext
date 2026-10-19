"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function SuperAdminAttendanceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="border-l-2 border-error px-5 py-8 text-center">
      <PageHeader title={"Couldn't load scoped attendance"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        The selected college attendance request failed. Retry without changing the safety scope.
      </p>
      <Button className="mt-5" onClick={reset}>Retry</Button>
    </section>
  );
}
