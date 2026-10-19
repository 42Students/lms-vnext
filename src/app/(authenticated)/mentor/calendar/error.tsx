"use client";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
export default function MentorCalendarError({
  error, reset,
}: {error: Error & {digest?: string};reset: () => void}) {
  useEffect(() => {console.error("Unable to load mentor project meetings",error);},[error]);
  return <div className="space-y-6" role="alert">
    <PageHeader eyebrow="Mentor" title="Meetings" />
    <div className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
      <p className="text-sm text-body">We couldn’t load your meetings. Your project data has not been changed.</p>
      <Button type="button" variant="secondary" onClick={reset}>
        Retry
      </Button>
    </div>
  </div>;
}
