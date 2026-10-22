import {PageHeader} from "@/components/ui/page-header";
import {Skeleton} from "@/components/ui/skeleton";

/** Legacy six-row project workspace shell while the selected college and
 * canonical project ID are verified. No foreign project facts are rendered. */
export default function Loading(){
 return <main role="status" aria-label="Loading project workspace"
   className="min-w-0 space-y-5 p-4 md:p-6" aria-busy="true">
  <PageHeader title="Project workspace" description="Loading project workspace…"/>
  <section className="min-w-0 rounded-[var(--lms-radius-card)] border border-border bg-white p-4">
    <Skeleton variant="row" count={6} label="Loading workspace summary"/>
  </section>
 </main>;
}
