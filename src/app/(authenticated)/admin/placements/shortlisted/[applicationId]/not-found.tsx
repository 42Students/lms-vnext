import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";
export default function NotFound(){
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Shortlisted applicant"/>
  <EmptyState title="Shortlisted applicant not found" description="This shortlisted record is unavailable in the selected college."
   action={<TextLink href="/admin/placements/shortlisted" className="inline-flex min-h-11 items-center md:min-h-9">Back to shortlisted applicants</TextLink>}/>
 </div>;
}
