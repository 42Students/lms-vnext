import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** Legacy directory starts with an eight-column, eight-row table skeleton. */
export default function ClassesLoading() {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Classes" />
    <GracefulPageLoading label="Loading classes…" shape="directory" />
    <div role="status" aria-label="Loading classes table" className="overflow-x-auto border border-border">
      <div className="grid min-w-[760px] grid-cols-8 border-b border-border bg-muted/30" aria-hidden="true">
        {Array.from({length: 8}, (_, column) => <div key={column} className="h-10 border-r border-border p-3">
          <div className="h-3 animate-pulse rounded bg-muted" /></div>)}
      </div>
      {Array.from({length: 8}, (_, row) => <div key={row} className="grid min-w-[760px] grid-cols-8 border-b border-border" aria-hidden="true">
        {Array.from({length: 8}, (_, column) => <div key={column} className="h-12 border-r border-border p-3">
          <div className="h-3 animate-pulse rounded bg-muted" /></div>)}
      </div>)}
    </div>
  </div>;
}
