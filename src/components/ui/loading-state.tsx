export function LoadingState({
  label = "Loading workspace…",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-border bg-surface p-6"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-pulse rounded-full bg-primary"
        />
        <p className="m-0 text-sm font-medium text-body">{label}</p>
      </div>
      <div className="mt-5 space-y-3" aria-hidden="true">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
