import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";
export default function StudentRulesNotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Student overrides and locks"/>
  <EmptyState title="Student access unavailable"
    description="This student is not available in the selected college module-access scope."
    action={<TextLink href="/admin/features" className="inline-flex min-h-11 items-center">Back to module access</TextLink>}/>
 </div>;
}
