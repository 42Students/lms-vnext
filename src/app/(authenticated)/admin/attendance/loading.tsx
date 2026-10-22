import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function SuperAdminAttendanceLoading() {
  return (
    <GracefulPageLoading label="Loading scoped attendance">
      <div className="min-w-0 space-y-4" aria-hidden="true">
        <div className="h-7 w-56 max-w-full rounded bg-muted" />
        <div className="flex flex-wrap gap-3 border-b border-border pb-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-10 w-40 max-w-full rounded bg-muted" />
          ))}
        </div>
        <div className="min-w-0 overflow-x-auto rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
          <div className="grid min-w-[560px] grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, row) =>
              Array.from({ length: 8 }, (_, column) => (
                <div key={row + "-" + column} className="h-8 rounded bg-muted" />
              )),
            )}
          </div>
        </div>
      </div>
    </GracefulPageLoading>
  );
}
