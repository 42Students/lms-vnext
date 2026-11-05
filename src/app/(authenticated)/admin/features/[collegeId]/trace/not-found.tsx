import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";
export default function LearnerAccessTraceNotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Learner access trace"/>
  <EmptyState title="Learner access unavailable"
    description="This learner is not available in the selected college access scope."
    action={<TextLink href="/admin/features" className="inline-flex min-h-11 items-center">Back to module access</TextLink>}/>
 </div>;
}
