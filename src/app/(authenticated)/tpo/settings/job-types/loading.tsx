import { Skeleton } from "@/components/ui/skeleton";
export default function Loading(){
 return <section aria-busy="true" aria-label="Loading job types" className="min-w-0 space-y-3">
  <p role="status" className="sr-only">Loading job types</p>
  <Skeleton variant="line" label="Loading job types" count={2}/>
  <div className="border border-border p-2">
   <Skeleton variant="row" label="Loading job types" count={6}/>
  </div>
 </section>;
}
