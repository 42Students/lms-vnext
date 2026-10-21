import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return <section className="min-w-0 space-y-4" aria-label="Loading assignments">
    <Skeleton variant="line" count={1} height={28} width={240} label="Loading assignments"/>
    <div className="flex flex-wrap gap-2" aria-hidden="true">
      {Array.from({length:3},(_,i)=><div key={i} className="lms-skeleton-shimmer h-8 w-24 rounded-full bg-[var(--lms-neutral-100)]"/>)}
    </div>
    <Skeleton variant="row" count={5} label="Loading assignment rows"/>
  </section>;
}
