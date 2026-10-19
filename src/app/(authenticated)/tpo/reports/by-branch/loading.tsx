import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Loading Reports · By Branch" className="space-y-4">
      <Skeleton variant="row" height={64} label="Loading Reports · By Branch" />
      <Skeleton variant="row" height={96} label="Loading Reports · By Branch" />
      <Skeleton variant="row" height={192} label="Loading Reports · By Branch" />
    </section>
  );
}
