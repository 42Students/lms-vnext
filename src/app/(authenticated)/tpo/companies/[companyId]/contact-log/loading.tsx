export default function TpoCompanyContactLogLoading() {
  return (
    <div aria-busy="true" aria-label="Loading company contact log" className="space-y-4">
      <div className="h-10 w-2/3 animate-pulse rounded bg-surface-subtle" />
      <div className="h-16 animate-pulse rounded bg-surface-subtle" />
      <div className="h-48 animate-pulse rounded bg-surface-subtle" />
    </div>
  );
}
