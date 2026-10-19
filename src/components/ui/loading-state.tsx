import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "Loading workspace…" }: { label?: string }) {
  return <section data-slot="loading-state" className="min-w-0 bg-transparent py-[var(--lms-space-2)]">
    <Skeleton label={label} variant="line" count={3} />
  </section>;
}
