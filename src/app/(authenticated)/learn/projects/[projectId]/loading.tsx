"use client";
import {useSearchParams} from "next/navigation";
import {canonicalLearnerProjectTab,LEARNER_PROJECT_DETAIL_TABS} from "@/modules/projects/learner-project-tab-alias-model";
export default function LearnerProjectDetailLoading(){
 const params=useSearchParams();
 const tab=canonicalLearnerProjectTab(params.get("tab"));
 const label=LEARNER_PROJECT_DETAIL_TABS.find(item=>item.key===tab)?.label??"Overview";
 return <section role="status" aria-busy="true" aria-label={"Loading project "+label} className="min-w-0 space-y-5">
  <h1 className="text-xl font-semibold">Project · {label}</h1>
  <div className="flex flex-wrap gap-4 border-b border-border pb-3" aria-hidden="true">
   {LEARNER_PROJECT_DETAIL_TABS.map(t=><span key={t.key} className="h-5 w-20 animate-pulse rounded bg-muted"/>)}
  </div>
  <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
   {Array.from({length:3},(_,i)=><div key={i} className="animate-pulse rounded border border-border p-4">
    <div className="h-4 w-1/2 rounded bg-muted"/><div className="mt-4 h-8 w-1/3 rounded bg-muted"/>
   </div>)}
  </div>
  <div className="animate-pulse space-y-3" aria-hidden="true">
   {Array.from({length:4},(_,i)=><div key={i} className="h-14 rounded border border-border bg-muted/30"/>)}
  </div>
 </section>;
}
