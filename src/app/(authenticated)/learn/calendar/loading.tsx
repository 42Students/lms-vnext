import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

/** Seven weekday headings and 21 day cells, matching the legacy skeleton. */
export default function LearnerCalendarLoading() {
  return (
    <section className="min-w-0 space-y-6" role="status" aria-busy="true" aria-live="polite">
      <PageHeader title="Class Schedule" />
      <span className="sr-only">Loading class schedule</span>
      <div className="min-h-[300px] space-y-4" aria-hidden="true">
        <SkeletonBlock className="h-8 w-[200px] max-w-full" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, day) => (
            <SkeletonBlock key={day} className="h-8" />
          ))}
          {Array.from({ length: 21 }, (_, day) => (
            <SkeletonBlock key={day} className="h-12" />
          ))}
        </div>
      </div>
    </section>
  );
}
