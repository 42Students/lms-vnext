import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TextLink } from "@/components/ui/text-link";

export const metadata={title:"Placement Announcements"}

export default function Page() {
  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader title="Placement Announcements" />
      <EmptyState
        title="Placement Announcements is not yet available"
        description="Placement notices and announcements for your college will appear here once this feature is enabled."
        action={
          <TextLink
            href="/college/placements"
            className="inline-flex min-h-11 items-center md:min-h-9"
          >
            Back to Placements
          </TextLink>
        }
      />
    </div>
  );
}
