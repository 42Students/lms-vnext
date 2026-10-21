import {Skeleton} from "@/components/ui/skeleton";

export default function Loading(){
  return <div className="min-h-screen bg-[#f5f7f9] px-4 py-8" aria-busy="true">
    <main className="mx-auto w-full max-w-[760px] rounded-[8px] border border-[#e5e9f0] bg-white p-6">
      <p role="status" className="mb-4 text-sm text-body">Loading placements...</p>
      <Skeleton variant="row" count={6} label="Loading public placements"/>
    </main>
  </div>;
}
