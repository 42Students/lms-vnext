import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/** Six-card legacy hiring dashboard loading; no zero metrics until data arrives. */
export default function Loading(){
 return <div className="min-w-0 space-y-5" aria-busy="true">
  <PageHeader title="Hiring Dashboard" />
  <section aria-label="Hiring metrics loading" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
   {["Drives","Applications","Shortlisted","Interviews","Offers","Selections"].map(label=>
    <div key={label} className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] p-4">
     <Skeleton label={label+" label loading"} variant="line" width={100}/>
     <Skeleton label={label+" count loading"} variant="line" height={28} width={70}/>
    </div>)}
  </section>
  <section className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] p-4" aria-label="Hiring report loading">
   <Skeleton variant="line" width={180} label="Report heading loading"/>
   <Skeleton variant="row" count={6} label="Report rows loading"/>
  </section>
 </div>;
}
