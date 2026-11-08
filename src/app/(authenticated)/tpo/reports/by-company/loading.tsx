import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section role="status" aria-live="polite" aria-busy="true" aria-label="Loading Reports · By Company" className="space-y-4">
      <span className="sr-only">Loading Reports · By Company</span>
      <Skeleton variant="row" height={64} label="Loading Reports · By Company" />
      <Skeleton variant="row" height={96} label="Loading Reports · By Company" />
      <Skeleton variant="row" height={192} label="Loading Reports · By Company" />
    </section>
  );
}
