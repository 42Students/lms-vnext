import {PageHeader} from "@/components/ui/page-header";
export default function Loading(){
 return <section aria-busy="true" className="min-w-0 space-y-4">
  <PageHeader title="Calendar" />
  <p role="status" className="sr-only">Loading TPO calendar and scheduled events…</p>
  <div aria-hidden="true" className="space-y-3 border-t border-border pt-4">
   <div className="flex items-center gap-3">
    <div className="h-9 w-28 animate-pulse rounded bg-muted"/>
    <div className="h-9 w-36 animate-pulse rounded bg-muted"/>
    <div className="h-9 w-24 animate-pulse rounded bg-muted"/>
   </div>
   <div className="grid grid-cols-7 gap-2">
    {Array.from({length:7},(_,i)=><div key={i} className="h-7 animate-pulse rounded bg-muted"/>)}
   </div>
   {Array.from({length:6},(_,row)=><div key={row} className="grid grid-cols-7 gap-2">
     {Array.from({length:7},(_,cell)=><div key={cell}
       className="h-14 animate-pulse rounded border border-border bg-muted/50"/>)}
   </div>)}
  </div>
 </section>;
}
