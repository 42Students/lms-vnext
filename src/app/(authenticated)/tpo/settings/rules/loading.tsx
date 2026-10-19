import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Loading Settings · Rules" className="space-y-4">
      <Skeleton variant="row" height={64} label="Loading Settings · Rules" />
      <Skeleton variant="row" height={96} label="Loading Settings · Rules" />
      <Skeleton variant="row" height={192} label="Loading Settings · Rules" />
    </section>
  );
}
