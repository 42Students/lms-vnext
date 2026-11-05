import { cx } from "@/lib/class-names";

/** One loading placeholder with the shared shimmer. Size it with height and width classes; the look is fixed. */
export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <span data-slot="skeleton" aria-hidden="true" className={cx("block min-w-0", className)}>
      <span className="lms-skeleton-shimmer block h-full w-full rounded-[var(--lms-skeleton-radius)] bg-[var(--lms-neutral-100)] motion-reduce:animate-none" />
    </span>
  );
}
