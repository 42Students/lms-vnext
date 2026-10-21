import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
 return <section aria-label="Loading class roster" aria-busy="true"
   className="min-w-0 space-y-4 py-2">
   <h1 className="sr-only">Students</h1>
   <p role="status" className="sr-only">Loading class list</p>
   <div aria-hidden="true" className="space-y-3 border-b border-border pb-3">
    <Skeleton variant="line" label="Loading class list" count={1}/>
    <div className="flex flex-wrap gap-3">
     <Skeleton variant="line" label="Loading class totals" count={3}/>
    </div>
   </div>
   <div aria-hidden="true" className="space-y-2">
    <Skeleton variant="form" label="Loading roster filters"/>
    <Skeleton variant="row" label="Loading students" count={5}/>
   </div>
 </section>;
}
