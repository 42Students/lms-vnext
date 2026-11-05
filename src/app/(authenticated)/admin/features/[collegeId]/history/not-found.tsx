import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";
export default function FeatureHistoryNotFound() {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Recent module-access changes"/>
  <EmptyState title="Changes unavailable"
    description="This history page is not available in the selected college scope."
    action={<TextLink href="/admin/features" className="inline-flex min-h-11 items-center text-sm">Back to module access</TextLink>}/>
 </div>;
}
