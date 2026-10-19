import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section aria-busy="true" aria-label="Loading TPO conversation" className="space-y-3">
      <Skeleton variant="row" height={36} width={224} label="Loading TPO conversation" />
      <Skeleton variant="row" height={96} label="Loading TPO conversation" />
    </section>
  );
}
