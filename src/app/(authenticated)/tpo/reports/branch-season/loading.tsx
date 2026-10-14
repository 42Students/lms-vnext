export default function TpoBranchSeasonLoading() {
  return (
    <div aria-busy="true" aria-label="Loading branch by season report" className="space-y-4">
      <div className="h-16 animate-pulse rounded-lg bg-muted" />
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="h-72 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
