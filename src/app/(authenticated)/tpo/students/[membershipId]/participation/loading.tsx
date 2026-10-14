export default function TpoParticipationLoading() {
  return (
    <div aria-busy="true" aria-label="Loading learner participation decision" className="space-y-5">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
