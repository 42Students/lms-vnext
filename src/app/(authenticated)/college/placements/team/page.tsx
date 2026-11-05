import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export const metadata={title:"Placement Team"}

export default function Page() {
  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader title="Placement Team" />
      <EmptyState
        title="Placement Team is not yet available"
        description="Placement officer profiles and contact information will appear here once this feature is enabled."
        action={
          <Link
            href="/college/placements"
            className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-ring md:min-h-9"
          >
            Back to Placements
          </Link>
        }
      />
    </div>
  );
}
