import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
export default function NotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Interview detail"/>
  <EmptyState title="Interview not found" description="The selected-college interview record is unavailable in this scope."
   action={<Link href="/admin/placements/interviews" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">Interviews</Link>}/>
 </div>;
}
