import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";

export default function OfferingNotFound() {
  return (
    <section className="min-w-0 space-y-4" role="status">
      <PageHeader title="Course Offering not found" actions={<PageBackLink href="/admin/courses" label="Back to Courses" />} />
      <p className="text-sm text-[var(--lms-muted-text)]">This Course Offering is unavailable in the selected college.</p>
    </section>
  );
}
