import { PageHeader } from "@/components/ui/page-header";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { Skeleton } from "@/components/ui/skeleton";
export default function LoadingJobTypesSettings(){
 return <div aria-busy="true" className="min-w-0 space-y-5">
  <PageHeader title="Settings" description="Manage placement policy, people and college communication."/>
  <div className="grid min-w-0 gap-6 lg:grid-cols-[224px_minmax(0,1fr)]">
   <TpoSettingsNav active="job-types"/>
   <section aria-label="Loading job types" className="min-w-0 space-y-4">
    <h2 className="text-xl font-semibold text-heading">Job types</h2>
    <Skeleton variant="row" count={6} label="Loading job types"/>
   </section>
  </div>
 </div>;
}
