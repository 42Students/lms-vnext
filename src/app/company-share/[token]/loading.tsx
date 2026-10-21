import {PageHeader} from "@/components/ui/page-header";
export default function CompanyShareLoading(){
 return <main role="status" aria-busy="true" aria-label="Loading shared applicants"
  className="mx-auto max-w-[1000px] space-y-5 px-5 py-12">
  <PageHeader title="Shared applicants"/>
  <div className="h-28 animate-pulse rounded-xl border border-border bg-surface"/>
  <div className="space-y-3 rounded-xl border border-border p-5">
   {Array.from({length:7},(_,index)=><div key={index} className="h-8 animate-pulse rounded-md bg-muted"/>)}
  </div>
 </main>;
}
