import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
export default function LearnerAccessTraceNotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Learner access trace"/>
  <EmptyState title="Learner access unavailable"
    description="This learner is not available in the selected college access scope."
    action={<Link href="/admin/features" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4">Back to module access</Link>}/>
 </div>;
}
