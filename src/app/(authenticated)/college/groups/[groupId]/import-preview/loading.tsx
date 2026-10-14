export default function GroupCsvPreviewLoading() {
  return <div aria-busy="true" aria-label="Loading student group import preview" className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-24 animate-pulse rounded-xl bg-muted" />
  </div>;
}
