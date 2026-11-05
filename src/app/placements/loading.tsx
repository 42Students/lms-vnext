import {Skeleton} from "@/components/ui/skeleton";

export default function Loading(){
  return <div className="min-h-screen bg-[color:var(--lms-neutral-50)] px-4 py-8" aria-busy="true">
    <main className="mx-auto w-full max-w-[760px] rounded-[8px] border border-border bg-surface p-6">
      <p role="status" className="mb-4 text-sm text-body">Loading placements...</p>
      <Skeleton variant="row" count={6} label="Loading public placements"/>
    </main>
  </div>;
}
