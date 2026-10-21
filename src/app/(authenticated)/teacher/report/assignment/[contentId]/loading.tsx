import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return <section className="min-w-0 space-y-5" aria-label="Loading assignment report">
    <Skeleton variant="line" count={1} height={28} width={280} label="Loading assignment report"/>
    <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({length:4},(_,i)=><Skeleton key={i} variant="kpi" label={"Loading report metric "+(i+1)}/>)}
    </div>
    <Skeleton variant="card" height={260} label="Loading assignment report chart"/>
  </section>;
}
