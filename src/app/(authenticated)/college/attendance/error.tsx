"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function CollegeAttendanceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="py-6 text-center">
      <PageHeader title={"Couldn't load attendance"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Attendance oversight failed to load. No student status is inferred from this failure.
      </p>
      <Button className="mt-5" onClick={reset}>Retry</Button>
    </section>
  );
}
