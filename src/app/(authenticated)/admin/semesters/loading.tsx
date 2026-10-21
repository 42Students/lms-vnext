import {PageHeader} from "@/components/ui/page-header";
export default function LoadingSuperAdminSemesters(){
 return <div className="space-y-6" aria-busy="true" role="status" aria-label="Loading semesters">
  <PageHeader title="Semesters"/>
  <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
   <div className="h-72 animate-pulse rounded-xl border border-border bg-surface"/>
   <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <div className="h-8 w-1/2 animate-pulse rounded bg-muted"/>
    {Array.from({length:8},(_,index)=><div key={index} className="h-9 animate-pulse rounded bg-muted"/>)}
   </div>
  </div>
 </div>;
}
