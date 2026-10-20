import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
export default function NotFound(){
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Shortlisted applicant"/>
  <EmptyState title="Shortlisted applicant not found" description="This shortlisted record is unavailable in the selected college."
   action={<Link href="/admin/placements/shortlisted" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Back to shortlisted applicants</Link>}/>
 </div>;
}
