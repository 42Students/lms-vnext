import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";
export default function NotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Interview detail"/>
  <EmptyState title="Interview not found" description="The selected-college interview record is unavailable in this scope."
   action={<TextLink href="/admin/placements/interviews" className="inline-flex min-h-11 items-center md:min-h-9">Interviews</TextLink>}/>
 </div>;
}
