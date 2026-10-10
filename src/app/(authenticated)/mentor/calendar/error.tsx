"use client";
import { useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
export default function MentorCalendarError({
  error, reset,
}: {error: Error & {digest?: string};reset: () => void}) {
  useEffect(() => {console.error("Unable to load mentor project meetings",error);},[error]);
  return <div className="space-y-6" role="alert">
    <PageHeader eyebrow="Mentor" title="Meetings" />
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-body">We couldn’t load your meetings. Your project data has not been changed.</p>
      <button type="button" onClick={reset}
        className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary-text">
        Retry
      </button>
    </div>
  </div>;
}
