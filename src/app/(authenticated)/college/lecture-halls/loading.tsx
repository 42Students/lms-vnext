export default function CollegeLectureHallsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading college lecture halls" className="space-y-4">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-72 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
