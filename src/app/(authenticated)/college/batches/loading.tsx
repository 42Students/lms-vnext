import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
  return <section className="min-w-0 space-y-4" aria-busy="true">
    <PageHeader title="Batches"/>
    <Skeleton variant="line" count={2} label="Loading batch filters"/>
    <Skeleton variant="row" count={8} label="Loading college batches"/>
  </section>;
}
