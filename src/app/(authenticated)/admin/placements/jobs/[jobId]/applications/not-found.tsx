import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
export default function NotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Applications"/>
  <EmptyState title="Drive not found" description="This drive's applications are unavailable in the selected college."
   action={<Link href="/admin/placements/drives" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">All drives</Link>}/>
 </div>;
}
