export default function TpoRecruiterAccessLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading recruiter college grants"
      className="space-y-5"
    >
      <div className="h-12 animate-pulse rounded-xl bg-muted" />

      <div className="h-36 animate-pulse rounded-xl bg-muted" />

      <div className="h-80 animate-pulse rounded-xl bg-muted" />

      <div className="h-12 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
