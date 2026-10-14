export default function HrJobLoading() {
  return <div className="space-y-4 animate-pulse" role="status" aria-label="Loading hiring job">
    <div className="h-9 w-2/3 rounded bg-muted" />
    <div className="h-40 rounded-xl bg-muted" />
    <div className="h-48 rounded-xl bg-muted" />
  </div>;
}
