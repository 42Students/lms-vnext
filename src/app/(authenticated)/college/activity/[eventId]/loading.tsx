export default function CollegeActivityDetailLoading() {
  return <div aria-busy="true" aria-label="Loading activity detail" className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-40 animate-pulse rounded-xl bg-muted" />
  </div>;
}
