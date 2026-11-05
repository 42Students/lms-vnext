import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";

export default function NotFound() {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Membership audit trail" />
    <EmptyState title="Membership not found"
      description="The selected membership is not available in this college."
      action={<TextLink href="/admin/people/directory" className="inline-flex min-h-11 items-center md:min-h-9">People directory</TextLink>} />
  </div>;
}
