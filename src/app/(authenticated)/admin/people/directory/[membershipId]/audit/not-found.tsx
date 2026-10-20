import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Membership audit trail" />
    <EmptyState title="Membership not found"
      description="The selected membership is not available in this college."
      action={<Link href="/admin/people/directory" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">People directory</Link>} />
  </div>;
}
