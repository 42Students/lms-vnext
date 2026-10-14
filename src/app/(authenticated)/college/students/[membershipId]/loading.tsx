export default function LoadingStudentDetail() {
  return <div aria-busy="true" aria-label="Loading student record" className="space-y-4">
    <div className="h-16 animate-pulse rounded-xl bg-muted" />
    <div className="h-52 animate-pulse rounded-xl bg-muted" />
  </div>;
}
