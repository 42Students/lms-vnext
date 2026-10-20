import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
export default function FeatureHistoryNotFound() {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Recent module-access changes"/>
  <EmptyState title="Changes unavailable"
    description="This history page is not available in the selected college scope."
    action={<Link href="/admin/features" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Back to module access</Link>}/>
 </div>;
}
