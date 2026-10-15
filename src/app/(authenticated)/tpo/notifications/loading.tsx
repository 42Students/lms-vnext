import { PageHeader } from "@/components/ui/page-header";

export default function TpoNotificationsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading TPO notifications">
      <PageHeader eyebrow="TPO" title="Notifications" description="Loading your notifications…" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-surface p-5">
            <div className="h-5 w-52 max-w-full rounded bg-muted" />
            <div className="mt-3 h-4 w-80 max-w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
