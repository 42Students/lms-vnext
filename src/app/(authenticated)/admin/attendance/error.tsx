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
    <section role="alert" className="min-w-0 space-y-3">
      <PageHeader title={"Couldn't load scoped attendance"} />
      <p className="mt-2 max-w-xl break-words text-sm leading-6 text-body">
        The selected college attendance request failed. Retry without changing the safety scope.
      </p>
      <Button className="mt-5 min-h-11 w-full md:min-h-9 md:w-auto" onClick={reset}>Retry</Button>
    </section>
  );
}
