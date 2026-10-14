export default function StudentImportLoading() {
  return <div aria-busy="true" aria-label="Loading student importer"
    className="space-y-4"><div className="h-20 animate-pulse rounded-xl bg-muted" />
    <div className="h-64 animate-pulse rounded-xl bg-muted" /></div>;
}
