import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
export default function StudentRuleHistoryNotFound(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Student module-rule history"/>
  <EmptyState title="History unavailable" description="No authorized history was found for this student in the selected college."
    action={<Link href="/admin/features" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4">Back to module access</Link>}/>
 </div>;
}
