import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";
export default function StudentRuleHistoryNotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Student module-rule history"/>
  <EmptyState title="History unavailable" description="No authorized history was found for this student in the selected college."
    action={<TextLink href="/admin/features" className="inline-flex min-h-11 items-center">Back to module access</TextLink>}/>
 </div>;
}
