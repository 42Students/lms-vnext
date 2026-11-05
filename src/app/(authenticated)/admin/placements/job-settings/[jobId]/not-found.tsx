import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";
export default function NotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Job settings detail"/>
  <EmptyState title="Job not found" description="The selected-college job eligibility policy is unavailable in this scope."
   action={<TextLink href="/admin/placements/job-settings" className="inline-flex min-h-11 items-center md:min-h-9">Job settings</TextLink>}/>
 </div>;
}
