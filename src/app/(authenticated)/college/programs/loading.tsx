import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function CollegeProgramsLoading() {
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Programs" description="Create, find and manage the programs in your college." />
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]">
      <section aria-label="Create New Program" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
        <h2 className="text-base font-semibold">Create New Program</h2>
        <GracefulPageLoading label="Loading program form" shape="directory"/>
      </section>
      <section aria-label="Existing Programs" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
        <h2 className="text-base font-semibold">Existing Programs</h2>
        <GracefulPageLoading label="Loading program rows" shape="directory"/>
      </section>
    </div>
  </div>;
}
