"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function FacultyAttendanceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 border-b border-border bg-transparent py-[var(--lms-space-5)]">
      <PageHeader title={"Couldn&apos;t load attendance"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Attendance data failed to load. This is not the same as an empty month or an unmarked class.
      </p>
      <div className="mt-5 flex justify-center">
        <Button variant="secondary" onClick={reset}>Retry</Button>
      </div>
    </section>
  );
}
