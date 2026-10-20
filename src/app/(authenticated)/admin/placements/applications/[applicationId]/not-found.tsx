import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
export default function NotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Application detail"/>
  <EmptyState title="Application not found" description="The selected-college application is unavailable in this scope."
   action={<Link href="/admin/placements/applications" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">Applications</Link>}/>
 </div>;
}
