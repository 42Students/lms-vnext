import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "Loading workspace…" }: { label?: string }) {
  return <section data-slot="loading-state" className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-6">
    <Skeleton label={label} variant="line" count={3} />
  </section>;
}
