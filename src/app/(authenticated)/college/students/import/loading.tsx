export default function StudentImportLoading() {
  return <div aria-busy="true" aria-label="Loading student importer"
    className="space-y-4"><div className="h-20 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" />
    <div className="h-64 animate-pulse rounded-[var(--lms-control-radius,9px)] bg-[var(--lms-neutral-100)]" /></div>;
}
