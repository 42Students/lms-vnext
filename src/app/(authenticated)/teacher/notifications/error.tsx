"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FacultyNotificationsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
      <h1 className="text-lg font-semibold text-foreground">Unable to load Notifications</h1>
      <p className="mt-2 text-sm text-body">
        This Faculty page could not load. Retry to recheck current access.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Link href="/teacher/courses" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Back to Courses
        </Link>
      </div>
    </section>
  );
}
