import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";
export default function NotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Applications"/>
  <EmptyState title="Drive not found" description="This drive's applications are unavailable in the selected college."
   action={<TextLink href="/admin/placements/drives" className="inline-flex min-h-11 items-center md:min-h-9">All drives</TextLink>}/>
 </div>;
}
