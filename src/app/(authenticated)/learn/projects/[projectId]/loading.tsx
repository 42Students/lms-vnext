"use client";
import {useSearchParams} from "next/navigation";
import {canonicalLearnerProjectTab,LEARNER_PROJECT_DETAIL_TABS} from "@/modules/projects/learner-project-tab-alias-model";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
export default function LearnerProjectDetailLoading(){
 const params=useSearchParams();
 const tab=canonicalLearnerProjectTab(params.get("tab"));
 const label=LEARNER_PROJECT_DETAIL_TABS.find(item=>item.key===tab)?.label??"Overview";
 return <section aria-label={"Loading project "+label} className="min-w-0 space-y-5">
  <PageHeader title={`Project · ${label}`} />
  <GracefulPageLoading label={"Loading project "+label+"…"}><div className="flex flex-wrap gap-4 border-b border-border pb-3" aria-hidden="true">
   {LEARNER_PROJECT_DETAIL_TABS.map(t=><SkeletonBlock key={t.key} className="h-5 w-20" />)}
  </div>
  <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
   {Array.from({length:3},(_,i)=><div key={i} className="rounded border border-border p-4">
    <SkeletonBlock className="h-4 w-1/2" /><SkeletonBlock className="mt-4 h-8 w-1/3" />
   </div>)}
  </div>
  <div className="space-y-3" aria-hidden="true">
   {Array.from({length:4},(_,i)=><SkeletonBlock key={i} className="h-14 border border-border" />)}
  </div></GracefulPageLoading>
 </section>;
}
