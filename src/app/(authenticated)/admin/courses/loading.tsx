import {PageHeader} from "@/components/ui/page-header";
export default function AdminCoursesLoading(){
 return <div className="space-y-5" aria-busy="true" role="status" aria-label="Loading courses">
  <PageHeader title="Courses"/>
  <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
   <div className="h-64 animate-pulse rounded-lg border border-border bg-surface"/>
   <div className="space-y-3 rounded-lg border border-border p-5">
    {Array.from({length:8},(_,index)=><div key={index} className="h-9 animate-pulse rounded bg-muted"/>)}
   </div>
  </div>
 </div>;
}
