export default function LearnerProjectsLoading() {
  return (
    <section aria-busy="true" aria-label="Loading assigned Projects" className="space-y-5">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({length:6},(_,index)=>(
          <div key={index} className="h-56 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <span className="sr-only">Loading your assigned Projects</span>
    </section>
  );
}
