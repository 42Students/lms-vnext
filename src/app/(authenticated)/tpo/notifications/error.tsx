"use client";
import { PageHeader } from "@/components/ui/page-header";

export default function TpoNotificationsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-6" role="alert">
      <PageHeader eyebrow="TPO" title="Notifications" />
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm text-body">
          We couldn&apos;t load your notifications. This is a read error, not evidence that you have none.
        </p>
        <button type="button" onClick={reset} className="mt-3 min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary-text">
          Retry
        </button>
      </div>
    </div>
  );
}
