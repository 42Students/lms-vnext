"use client";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
export default function MentorCalendarError({
  error, reset,
}: {error: Error & {digest?: string};reset: () => void}) {
  useEffect(() => {console.error("Unable to load mentor project meetings",error);},[error]);
  return <div className="min-w-0 max-w-full space-y-4" role="alert">
    <PageHeader eyebrow="Mentor" title="Meetings" />
    <div className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
      <p className="text-sm text-body">We couldn’t load your meetings. Your project data has not been changed.</p>
      <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>
        Retry
      </Button>
    </div>
  </div>;
}
