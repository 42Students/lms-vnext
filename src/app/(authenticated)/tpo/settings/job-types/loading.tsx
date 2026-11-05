import { PageHeader } from "@/components/ui/page-header";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading } from "@/components/ui/heading";
export default function LoadingJobTypesSettings(){
 return <div aria-busy="true" className="min-w-0 space-y-5">
  <PageHeader title="Settings" description="Manage placement policy, people and college communication."/>
  <div className="grid min-w-0 gap-6 lg:grid-cols-[224px_minmax(0,1fr)]">
   <TpoSettingsNav active="job-types"/>
   <section aria-label="Loading job types" className="min-w-0 space-y-4">
    <Heading level={2} size="xl" className="text-heading">Job types</Heading>
    <Skeleton variant="row" count={6} label="Loading job types"/>
   </section>
  </div>
 </div>;
}
