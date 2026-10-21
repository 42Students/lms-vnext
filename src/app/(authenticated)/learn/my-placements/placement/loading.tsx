import {PageHeader} from "@/components/ui/page-header";
export default function PlacementCellLoading(){
 return <div className="space-y-4" role="status" aria-label="Loading placement cell" aria-busy="true">
  <PageHeader title="Placement cell"/>
  {Array.from({length:3},(_,i)=><section key={i} className="space-y-3 rounded-xl border border-border p-5">
   <div className="h-6 w-44 animate-pulse rounded bg-muted"/>
   {Array.from({length:3},(_,j)=><div key={j} className="h-9 animate-pulse rounded bg-muted"/>)}
  </section>)}
 </div>;
}
