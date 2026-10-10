export default function FacultyCourseDiscussionsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading discussions" className="space-y-5">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-[34rem] animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
