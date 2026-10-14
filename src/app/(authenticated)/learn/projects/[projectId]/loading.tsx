export default function LearnerProjectDetailLoading() {
  return (
    <section aria-label="Loading Project workspace" aria-busy="true" className="space-y-4">
      <div className="h-12 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({length:4},(_,index)=>(
          <div key={index} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <span className="sr-only">Loading your Project details</span>
    </section>
  );
}
