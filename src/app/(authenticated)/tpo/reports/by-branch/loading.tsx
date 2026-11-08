import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section role="status" aria-live="polite" aria-busy="true" aria-label="Loading Reports · By Branch" className="space-y-4">
      <span className="sr-only">Loading Reports · By Branch</span>
      <Skeleton variant="row" height={64} label="Loading Reports · By Branch" />
      <Skeleton variant="row" height={96} label="Loading Reports · By Branch" />
      <Skeleton variant="row" height={192} label="Loading Reports · By Branch" />
    </section>
  );
}
